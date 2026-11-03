"""
Serializers
-----------
Serialize DB models → JSON shapes the frontend expects exactly.

Key contract alignment:
  - Task.due_at  → serialized as "due_date" (frontend uses this field name)
  - Task.kind    → serialized as "type"
  - Expense amounts are floats (the frontend uses number)
"""

from rest_framework import serializers
from .models import Expense, Task, VoiceRequest


class ExpenseSerializer(serializers.ModelSerializer):
    amount = serializers.FloatField()  # frontend expects number, not string Decimal

    class Meta:
        model = Expense
        fields = ["id", "amount", "category", "description", "created_at"]


class TaskSerializer(serializers.ModelSerializer):
    # Frontend expects "due_date" and "type", not "due_at" and "kind"
    due_date = serializers.DateTimeField(source="due_at", allow_null=True, required=False)
    type = serializers.CharField(source="kind", read_only=True)

    class Meta:
        model = Task
        fields = ["id", "title", "due_date", "status", "created_at", "type"]


class TaskPatchSerializer(serializers.ModelSerializer):
    """Accepts only `status` for PATCH /api/tasks/{id}."""
    class Meta:
        model = Task
        fields = ["status"]


class ActivityActionSerializer(serializers.Serializer):
    """Serializes a single action dict stored in VoiceRequest.results."""
    id = serializers.CharField()
    type = serializers.CharField()
    status = serializers.CharField()
    real = serializers.BooleanField()
    summary = serializers.CharField()
    data = serializers.DictField()


class ActivityEntrySerializer(serializers.ModelSerializer):
    actions = serializers.SerializerMethodField()

    class Meta:
        model = VoiceRequest
        fields = ["id", "transcript", "actions", "created_at"]

    def get_actions(self, obj):
        results = obj.results or []
        return results  # already in the right shape from executor
