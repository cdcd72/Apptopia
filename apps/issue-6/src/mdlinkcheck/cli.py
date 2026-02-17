"""CLI entry point for mdlinkcheck."""

import argparse
import sys
from pathlib import Path
from typing import Optional

from .scanner import MarkdownScanner
from .checker import LinkChecker
from .reporter import Reporter
from .config import Config


def main() -> int:
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        prog="mdlinkcheck",
        description="Check health of links in Markdown files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  mdlinkcheck https://github.com/owner/repo
  mdlinkcheck /path/to/local/folder
  mdlinkcheck . --format json
  mdlinkcheck . --config .mdlinkcheckrc
""",
    )
    
    parser.add_argument(
        "source",
        help="GitHub repository URL or local folder path",
    )
    parser.add_argument(
        "--format",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument(
        "--config",
        type=Path,
        help="Path to config file (default: .mdlinkcheckrc in current directory)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=10,
        help="HTTP request timeout in seconds (default: 10)",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=10,
        help="Maximum concurrent HTTP requests (default: 10)",
    )
    
    args = parser.parse_args()
    
    # Load configuration
    config = Config.load(args.config)
    
    # Scan for markdown files and extract links
    scanner = MarkdownScanner(args.source)
    try:
        markdown_files = scanner.scan()
    except Exception as e:
        print(f"Error scanning source: {e}", file=sys.stderr)
        return 1
    
    if not markdown_files:
        print("No Markdown files found.", file=sys.stderr)
        return 1
    
    # Check all links
    checker = LinkChecker(
        timeout=args.timeout,
        max_workers=args.max_workers,
        config=config,
    )
    results = checker.check_all(markdown_files, scanner.base_path)
    
    # Generate report
    reporter = Reporter(args.format)
    reporter.report(results, scanner.source_name)
    
    # Determine exit code
    has_broken = any(
        any(r.status != "ok" for r in file_results.results)
        for file_results in results.values()
    )
    
    return 1 if has_broken else 0


if __name__ == "__main__":
    sys.exit(main())
