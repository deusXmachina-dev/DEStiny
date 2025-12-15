from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base class for models that need created and updated timestamps."""

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
