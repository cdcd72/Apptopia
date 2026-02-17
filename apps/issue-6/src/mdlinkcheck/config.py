"""Configuration management for mdlinkcheck."""

import json
from pathlib import Path
from typing import Optional, List, Pattern
import re


class Config:
    """Configuration for link checking."""
    
    def __init__(self):
        self.exclude_patterns: List[Pattern] = []
    
    @classmethod
    def load(cls, config_path: Optional[Path] = None) -> "Config":
        """Load configuration from file."""
        config = cls()
        
        # Try to find config file
        if config_path is None:
            config_path = Path(".mdlinkcheckrc")
        
        if not config_path.exists():
            return config
        
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Parse exclude patterns
            if "exclude_urls" in data:
                for pattern in data["exclude_urls"]:
                    try:
                        config.exclude_patterns.append(re.compile(pattern))
                    except re.error as e:
                        print(f"Warning: Invalid regex pattern '{pattern}': {e}")
        
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not load config file: {e}")
        
        return config
    
    def should_check_url(self, url: str) -> bool:
        """Check if URL should be checked based on exclude patterns."""
        for pattern in self.exclude_patterns:
            if pattern.search(url):
                return False
        return True
