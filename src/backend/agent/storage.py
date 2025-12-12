"""
Blueprint storage abstraction for session-based and future database storage.
"""

from dataclasses import dataclass

from destiny_sim.builder.schema import Blueprint


@dataclass
class BlueprintStorage:
    """
    Storage abstraction for blueprint persistence.
    
    Currently uses Django sessions, but can be easily migrated to database storage.
    """
    
    session: dict  # Django session dict
    
    SESSION_KEY = "blueprint"
    
    def get_blueprint(self) -> Blueprint:
        """
        Get the current blueprint from storage.
        
        Returns:
            Blueprint instance. Creates a new empty blueprint if none exists.
        """
        blueprint_json = self.session.get(self.SESSION_KEY)
        
        if blueprint_json is None:
            # Initialize with empty blueprint
            blueprint = Blueprint()
            self.save_blueprint(blueprint)
            return blueprint
        
        # Deserialize from JSON
        return Blueprint.model_validate_json(blueprint_json)
    
    def save_blueprint(self, blueprint: Blueprint) -> None:
        """
        Save blueprint to storage.
        
        Args:
            blueprint: The blueprint to save
        """
        # Serialize to JSON and store in session
        self.session[self.SESSION_KEY] = blueprint.model_dump_json()
        # Mark session as modified to ensure it's saved
        self.session.modified = True
        # Explicitly save the session (required for streaming responses)
        # Wrap in try-except to handle cases where save() might fail
        # (e.g., in tests without database access)
        if hasattr(self.session, 'save'):
            try:
                self.session.save()
            except Exception:
                # If save fails, session is still marked as modified
                # Django middleware will attempt to save it at end of request
                pass
    
    def clear_blueprint(self) -> None:
        """
        Clear the current blueprint from storage.
        """
        if self.SESSION_KEY in self.session:
            del self.session[self.SESSION_KEY]
            self.session.modified = True
            # Explicitly save the session (required for streaming responses)
            # Wrap in try-except to handle cases where save() might fail
            # (e.g., in tests without database access)
            if hasattr(self.session, 'save'):
                try:
                    self.session.save()
                except Exception:
                    # If save fails, session is still marked as modified
                    # Django middleware will attempt to save it at end of request
                    pass
