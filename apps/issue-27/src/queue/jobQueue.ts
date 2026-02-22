import type { QueueItem, QueueStatus } from "../types";

export type QueueUpdateHandler = (items: QueueItem[]) => Promise<void>;
export type QueueWorker = (item: QueueItem) => Promise<void>;

export class JobQueue {
  private items: QueueItem[];
  private readonly onUpdate: QueueUpdateHandler;
  private readonly worker: QueueWorker;
  private processing = false;

  constructor(initialItems: QueueItem[], onUpdate: QueueUpdateHandler, worker: QueueWorker) {
    this.items = [...initialItems];
    this.onUpdate = onUpdate;
    this.worker = worker;
    logQueue("queue.init", {
      totalItems: this.items.length,
      queuedItems: this.items.filter((item) => item.status === "queued").length
    });
  }

  getItems(): QueueItem[] {
    return [...this.items];
  }

  getPosition(id: string): number | null {
    const pending = this.items.filter((item) => item.status === "queued");
    const index = pending.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }
    return index + 1;
  }

  async enqueue(item: QueueItem): Promise<void> {
    logQueue("queue.enqueue.start", {
      id: item.id,
      chatId: item.chatId,
      status: item.status,
      beforeCount: this.items.length
    });
    this.items.push(item);
    await this.persist();
    logQueue("queue.enqueue.done", {
      id: item.id,
      afterCount: this.items.length,
      position: this.getPosition(item.id)
    });
    void this.processNext();
  }

  private async updateStatus(id: string, status: QueueStatus, error?: string): Promise<void> {
    const now = new Date().toISOString();
    logQueue("queue.status.update", { id, status, error });
    this.items = this.items.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            updatedAt: now,
            error: error ?? item.error
          }
        : item
    );
    await this.persist();
  }

  private async persist(): Promise<void> {
    logQueue("queue.persist.start", { totalItems: this.items.length });
    await this.onUpdate(this.items);
    logQueue("queue.persist.done", { totalItems: this.items.length });
  }

  private async processNext(): Promise<void> {
    if (this.processing) {
      logQueue("queue.process.skip_already_processing");
      return;
    }
    const next = this.items.find((item) => item.status === "queued");
    if (!next) {
      logQueue("queue.process.no_pending");
      return;
    }
    this.processing = true;
    logQueue("queue.process.start", {
      id: next.id,
      chatId: next.chatId
    });
    await this.updateStatus(next.id, "processing");
    try {
      await this.worker(next);
      await this.updateStatus(next.id, "done");
      logQueue("queue.process.done", { id: next.id });
    } catch (error: any) {
      const message = error?.message ?? "未知錯誤";
      await this.updateStatus(next.id, "error", message);
      logQueue("queue.process.error", { id: next.id, error: message });
    } finally {
      this.processing = false;
      logQueue("queue.process.finalize", { id: next.id });
      void this.processNext();
    }
  }
}

function logQueue(event: string, data?: Record<string, unknown>): void {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...data
  };
  console.info("[queue]", JSON.stringify(payload));
}
