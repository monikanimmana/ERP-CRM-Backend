"""
seed_demo management command
-----------------------------
Populates the DB with ~25 realistic expenses across the last 30 days
and 5 tasks/reminders. Used by POST /api/demo/reset.

Run directly:  python manage.py seed_demo
Run with wipe: python manage.py seed_demo --flush
"""

import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone as tz

from api.models import Expense, Task


class Command(BaseCommand):
    help = "Seed realistic demo data (expenses + tasks)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing data before seeding",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            Expense.objects.all().delete()
            Task.objects.all().delete()
            self.stdout.write("Flushed existing data.")

        today = date.today()

        # ── 25 realistic expenses ─────────────────────────────────────────
        EXPENSES = [
            # Today
            (today, 180, "Food", "lunch at canteen"),
            (today, 45, "Food", "chai and biscuits"),
            (today, 250, "Travel", "Uber to office"),
            # Yesterday
            (today - timedelta(days=1), 320, "Food", "dinner with friends"),
            (today - timedelta(days=1), 150, "Travel", "metro card recharge"),
            (today - timedelta(days=1), 899, "Shopping", "t-shirt online"),
            # 2 days ago
            (today - timedelta(days=2), 60, "Food", "breakfast"),
            (today - timedelta(days=2), 120, "Travel", "auto rickshaw"),
            # 3 days ago
            (today - timedelta(days=3), 1200, "Bills", "electricity bill"),
            (today - timedelta(days=3), 85, "Food", "chai and samosa"),
            (today - timedelta(days=3), 499, "Entertainment", "Netflix subscription"),
            # 5 days ago
            (today - timedelta(days=5), 2500, "Health", "doctor consultation"),
            (today - timedelta(days=5), 340, "Health", "medicines"),
            (today - timedelta(days=5), 75, "Food", "juice"),
            # 7 days ago
            (today - timedelta(days=7), 450, "Food", "pizza"),
            (today - timedelta(days=7), 200, "Travel", "cab"),
            # 10 days ago
            (today - timedelta(days=10), 3200, "Shopping", "groceries monthly"),
            (today - timedelta(days=10), 180, "Food", "restaurant lunch"),
            # 12 days ago
            (today - timedelta(days=12), 599, "Education", "Udemy course"),
            (today - timedelta(days=12), 95, "Food", "coffee"),
            # 15 days ago
            (today - timedelta(days=15), 1800, "Bills", "mobile recharge"),
            (today - timedelta(days=15), 250, "Travel", "fuel"),
            # 20 days ago
            (today - timedelta(days=20), 4500, "Shopping", "shoes"),
            (today - timedelta(days=20), 150, "Food", "street food"),
            # 28 days ago
            (today - timedelta(days=28), 800, "Entertainment", "movie tickets for two"),
        ]

        for spent_on, amount, category, description in EXPENSES:
            Expense.objects.get_or_create(
                amount=amount,
                category=category,
                description=description,
                spent_on=spent_on,
                defaults={"currency": "INR"},
            )

        # ── 5 tasks / reminders ───────────────────────────────────────────
        TASKS = [
            ("reminder", "Submit monthly expense report",
             tz.make_aware(tz.datetime(today.year, today.month, today.day, 10, 0) + timedelta(days=2))),
            ("reminder", "Call doctor for follow-up",
             tz.make_aware(tz.datetime(today.year, today.month, today.day, 11, 0) + timedelta(days=1))),
            ("task", "Review SayDone demo before presentation", None),
            ("reminder", "Pay credit card bill",
             tz.make_aware(tz.datetime(today.year, today.month, today.day, 9, 0) + timedelta(days=5))),
            ("task", "Buy groceries for the week", None),
        ]

        for kind, title, due_at in TASKS:
            Task.objects.get_or_create(
                title=title,
                defaults={"kind": kind, "due_at": due_at, "status": "open"},
            )

        expense_count = Expense.objects.count()
        task_count = Task.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data seeded: {expense_count} expenses, {task_count} tasks."
            )
        )
