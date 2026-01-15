from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    KeyboardButton,
)
from work_management.models import Role


def get_contact_request_keyboard():
    """Request contact sharing keyboard"""
    keyboard = [[KeyboardButton("📱 Share Contact", request_contact=True)]]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True, one_time_keyboard=True)


def get_main_menu_keyboard(role):
    """Main menu keyboard based on user role"""
    if role.lower() == Role.WORKER:
        keyboard = [
            [
                InlineKeyboardButton(
                    "📋 Available Tasks", callback_data="menu_available_tasks"
                )
            ],
            # [InlineKeyboardButton("My Tasks", callback_data="menu_my_tasks")],
            # [InlineKeyboardButton("My Profile", callback_data="menu_profile")],
            # [InlineKeyboardButton("Task History", callback_data="menu_history")],
        ]
    else:  # SUPERVISOR
        keyboard = [
            # [InlineKeyboardButton("Create Task", callback_data="menu_create_task")],
            # [InlineKeyboardButton("My Tasks", callback_data="menu_my_tasks")],
            [
                InlineKeyboardButton(
                    "👷 View Workers", callback_data="menu_view_workers"
                )
            ],
            # [InlineKeyboardButton("My Profile", callback_data="menu_profile")],
        ]

    return InlineKeyboardMarkup(keyboard)


def get_skip_button():
    """Skip button for optional fields"""
    keyboard = [[InlineKeyboardButton("⏭ Skip", callback_data="skip")]]
    return InlineKeyboardMarkup(keyboard)


def get_task_categories_keyboard():
    assert False, "TODO: get_task_categories_keyboard() is not implemented yet"


def get_task_list_keyboard(tasks, prefix="task"):
    """Generate keyboard with list of tasks"""
    keyboard = []
    for task in tasks:
        status_emoji = {
            "OPEN": "🟢",
            "ASSIGNED": "🟡",
            "IN_PROGRESS": "🔵",
            "SUBMITTED": "🟠",
            "COMPLETED": "✅",
            "CANCELLED": "❌",
        }.get(task["status"], "⚪")

        button_text = f"{status_emoji} #{task['id']}: {task['title'][:30]}"
        keyboard.append(
            [InlineKeyboardButton(button_text, callback_data=f'{prefix}_{task["id"]}')]
        )

    if not keyboard:
        keyboard.append(
            [InlineKeyboardButton("No tasks available", callback_data="none")]
        )

    keyboard.append(
        [InlineKeyboardButton("🔙 Back to Menu", callback_data="back_to_menu")]
    )
    return InlineKeyboardMarkup(keyboard)


def get_task_detail_keyboard(task, user_role):
    """Keyboard for task detail actions"""
    keyboard = []

    if user_role == Role.WORKER:
        if task["status"] == "ASSIGNED":
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "▶️ Start Task", callback_data=f'start_task_{task["id"]}'
                    )
                ]
            )

        if task["status"] == "IN_PROGRESS":
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "📝 Update Progress",
                        callback_data=f'update_progress_{task["id"]}',
                    )
                ]
            )
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "✅ Mark Complete", callback_data=f'complete_task_{task["id"]}'
                    )
                ]
            )

    elif user_role == Role.SUPERVISOR:
        if task["status"] == "OPEN":
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "👷 Assign to Worker", callback_data=f'assign_task_{task["id"]}'
                    )
                ]
            )

        if task["status"] == "SUBMITTED":
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "✅ Mark Complete", callback_data=f'complete_task_{task["id"]}'
                    )
                ]
            )
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "⭐ Rate Task", callback_data=f'rate_task_{task["id"]}'
                    )
                ]
            )

        if task["status"] == "COMPLETED" and not task.get("rating"):
            keyboard.append(
                [
                    InlineKeyboardButton(
                        "⭐ Rate Task", callback_data=f'rate_task_{task["id"]}'
                    )
                ]
            )

    keyboard.append([InlineKeyboardButton("🔙 Back", callback_data="back_to_tasks")])
    keyboard.append(
        [InlineKeyboardButton("🏠 Main Menu", callback_data="back_to_menu")]
    )

    return InlineKeyboardMarkup(keyboard)


def get_worker_list_keyboard(workers):
    """Generate keyboard with list of workers"""
    keyboard = []
    for worker in workers:
        worker_profile = worker.get("worker_profile", {})
        rep_score = worker_profile.get("reputation_score", 0)
        button_text = f"👷 {worker['full_name']} (Rep: {rep_score})"
        keyboard.append(
            [InlineKeyboardButton(button_text, callback_data=f'worker_{worker["id"]}')]
        )

    if not keyboard:
        keyboard.append(
            [InlineKeyboardButton("No workers available", callback_data="none")]
        )

    keyboard.append(
        [InlineKeyboardButton("🔙 Back to Menu", callback_data="back_to_menu")]
    )
    return InlineKeyboardMarkup(keyboard)


def get_assign_worker_keyboard(workers, task_id):
    """Keyboard for assigning a task to a worker"""
    keyboard = []
    for worker in workers:
        worker_profile = worker.get("worker_profile", {})
        rep_score = worker_profile.get("reputation_score", 0)
        button_text = f"👷 {worker['full_name']} (Rep: {rep_score})"
        keyboard.append(
            [
                InlineKeyboardButton(
                    button_text, callback_data=f'assign_to_{task_id}_{worker["id"]}'
                )
            ]
        )

    keyboard.append(
        [InlineKeyboardButton("❌ Cancel", callback_data=f"task_{task_id}")]
    )
    return InlineKeyboardMarkup(keyboard)


def get_rating_keyboard(task_id):
    """Keyboard for rating a task (1-5 stars)"""
    keyboard = [
        [
            InlineKeyboardButton("⭐", callback_data=f"rate_{task_id}_1"),
            InlineKeyboardButton("⭐⭐", callback_data=f"rate_{task_id}_2"),
            InlineKeyboardButton("⭐⭐⭐", callback_data=f"rate_{task_id}_3"),
        ],
        [
            InlineKeyboardButton("⭐⭐⭐⭐", callback_data=f"rate_{task_id}_4"),
            InlineKeyboardButton("⭐⭐⭐⭐⭐", callback_data=f"rate_{task_id}_5"),
        ],
        [InlineKeyboardButton("❌ Cancel", callback_data=f"task_{task_id}")],
    ]
    return InlineKeyboardMarkup(keyboard)


def get_cancel_keyboard():
    """Simple cancel button"""
    keyboard = [[InlineKeyboardButton("❌ Cancel", callback_data="cancel")]]
    return InlineKeyboardMarkup(keyboard)
