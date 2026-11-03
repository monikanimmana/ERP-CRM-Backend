"""
SayDone Models
--------------
Three models:
  VoiceRequest  — every voice call; powers the activity timeline
  Expense       — a logged expense
  Task          — a task OR reminder (kind field distinguishes)

Indexes on hot query paths: spent_on (dashboard totals), (status, due_at)
(open tasks list).

No auth model — single demo user, stated honestly.
"""

import uuid
from django.db import models


class VoiceRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transcript = models.TextField()
    lang = models.CharField(max_length=10, default="en-IN")
    parsed_json = models.JSONField(null=True, blank=True)   # raw LLM output
    results = models.JSONField(null=True, blank=True)        # action results
    llm_provider = models.CharField(max_length=30, default="rules_fallback")
    timings = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"VoiceRequest({self.transcript[:40]})"


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ("Food", "Food"),
        ("Travel", "Travel"),
        ("Shopping", "Shopping"),
        ("Bills", "Bills"),
        ("Education", "Education"),
        ("Health", "Health"),
        ("Entertainment", "Entertainment"),
        ("Other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default="Other")
    description = models.CharField(max_length=200)
    spent_on = models.DateField()                             # indexed below
    created_at = models.DateTimeField(auto_now_add=True)
    voice_request = models.ForeignKey(
        VoiceRequest, null=True, blank=True, on_delete=models.SET_NULL, related_name="expenses"
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["spent_on"])]

    def __str__(self):
        return f"Expense({self.amount} {self.category})"


class Task(models.Model):
    KIND_CHOICES = [("task", "Task"), ("reminder", "Reminder")]
    STATUS_CHOICES = [("open", "Open"), ("done", "Done")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="task")
    title = models.CharField(max_length=300)
    due_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    voice_request = models.ForeignKey(
        VoiceRequest, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks"
    )

    class Meta:
        ordering = ["due_at", "-created_at"]
        indexes = [models.Index(fields=["status", "due_at"])]

    def __str__(self):
        return f"Task({self.kind}: {self.title[:40]})"
