import os
import django
from functools import wraps

from telegram import Update
from telegram.ext import ContextTypes
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardRemove

from django.conf import settings
from asgiref.sync import sync_to_async
from cpass_integration.auth_tokens import generate_auth_token

from workers.models import CustomUser as User
from work_management.models import Task, Role
from telegram_bot.models import ContactVerification
from telegram_bot.notifications import send_telegram_notification, notify_task_completed
from telegram_bot.keyboards import *
from telegram_bot.utils import *

import logging

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)


def require_contact(func):

    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        telegram_id = update.effective_user.id

        # Check if contact was verified
        @sync_to_async
        def has_shared_contact():
            return ContactVerification.objects.filter(telegram_id=telegram_id).exists()

        if not await has_shared_contact():
            await update.message.reply_text(
                "⚠️ Please share your contact first to use this bot.\n\n"
                "Use /start to begin.",
                reply_markup=ReplyKeyboardRemove(),
            )
            return

        return await func(update, context)

    return wrapper


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""

    logger.info(f"Start command received from user {update.effective_user.id}")

    telegram_id = update.effective_user.id
    user = await get_user_by_telegram_id(telegram_id)


    if user and user.get("phone_number"):
        welcome_message = f"Welcome back, {user['full_name']}!"
        # await update.message.reply_text(
        #     welcome_message, reply_markup=get_main_menu_keyboard(user["role"])
        # )

        await update.message.reply_text(welcome_message)
    else:
        # User needs to share contact first
        await update.message.reply_text(
            "🔐 <b>Contact Verification Required</b>\n\n"
            "To ensure security and build trust in our platform, "
            "please share your contact information.\n\n"
            "📱 Tap the button below to share your contact.",
            parse_mode="HTML",
            reply_markup=get_contact_request_keyboard(),
        )


@require_contact
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    telegram_id = update.effective_user.id
    user = await get_user_by_telegram_id(telegram_id)

    if user["role"] == Role.WORKER:
        help_text = """
<b>Worker Commands:</b>

/start - Show main menu
/help - Show this help message
/cancel - Cancel current operation

"""
    else:
        help_text = """
<b>Supervisor Commands:</b>

/start - Show main menu
/help - Show this help message
/cancel - Cancel current operation

"""

    await update.message.reply_text(help_text, parse_mode="HTML")


@require_contact
async def profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /profile command"""
    telegram_id = update.effective_user.id
    user = await get_user_by_telegram_id(telegram_id)

    profile_text = format_profile(user)
    await update.message.reply_text(
        profile_text,
        parse_mode="HTML",
        reply_markup=get_main_menu_keyboard(user["role"]),
    )


@require_contact
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /cancel command"""
    telegram_id = update.effective_user.id
    await clear_conversation_state(telegram_id)

    await update.message.reply_text(
        "Operation cancelled. Use /start to see the main menu."
    )


async def handle_contact(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle contact message when user shares their phone number"""
    telegram_id = update.effective_user.id
    contact = update.message.contact


    if contact.user_id != telegram_id:
        await update.message.reply_text(
            "⚠️ Please share your own contact, not someone else's.",
            reply_markup=get_contact_request_keyboard(),
        )
        return

    phone_number = contact.phone_number

    user = await get_user_by_telegram_id(telegram_id)

    @sync_to_async
    def save_contact_verification():
        try:
            ContactVerification.objects.update_or_create(
                telegram_id=telegram_id,
                defaults={
                    "phone_number": phone_number,
                    "telegram_username": update.effective_user.username or "",
                    "first_name": update.effective_user.first_name or "",
                },
            )

            if user:
                user_obj = User.objects.get(telegram_id=telegram_id)
                user_obj.phone_number = phone_number
                user_obj.save()
            return True
        except Exception as e:
            logger.error(f"Error saving contact: {e}")
            return False

    success = await save_contact_verification()

    if not success:
        await update.message.reply_text(
            "❌ Failed to save contact. Please try /start again."
        )
        return

    if user:
        await update.message.reply_text(
            "✅ Contact verified!\n\n" f"Welcome back, {user['full_name']}!",
            reply_markup=ReplyKeyboardRemove(),
        )
        await update.message.reply_text(
            "Choose an option:",
            reply_markup=get_main_menu_keyboard(user["role"]),
        )
    else:
        # New user - proceed to registration

        # Generate one-time auth token
        auth_token = generate_auth_token(str(telegram_id), phone_number)

        # Proceed to registration with auth token
        domain = f"{settings.CPASS_URL}/signup/basic-info-telegram?token={auth_token}"
        print(f"DEBUG BOT SIGNUP DOMAIN: {domain}")
        # For local development:
        # domain = f"http://localhost:5173/signup/basic-info-telegram?token={auth_token}"

        keyboard = [
            [
                InlineKeyboardButton(
                    "📝 Complete Registration",
                    web_app={"url": f"{domain}"},
                )
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            "✅ <b>Contact Verified!</b>\n\n"
            "📱 Phone: <code>" + phone_number + "</code>\n\n"
            "Now let's complete your registration.\n\n"
            "<b>Build your portable reputation through verified work!</b>\n\n"
            "Click the button Menu to get started.",
            parse_mode="HTML",
            reply_markup=ReplyKeyboardRemove(),
        )
        # await update.message.reply_text(
        # "Complete your registration:",
        # reply_markup=reply_markup,
        # )


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()

    telegram_id = query.from_user.id
    callback_data = query.data

    # Check if contact was verified
    @sync_to_async
    def has_shared_contact():
        return ContactVerification.objects.filter(telegram_id=telegram_id).exists()

    if not await has_shared_contact():
        await query.message.reply_text(
            "⚠️ Please share your contact first to use this bot.\n\n"
            "Use /start to begin.",
            reply_markup=get_contact_request_keyboard(),
        )
        return

    # Role selection during registration
    if callback_data.startswith("role_"):
        await handle_role_selection(query, telegram_id, callback_data)

    # Main menu actions
    elif callback_data.startswith("menu_"):
        await handle_menu_selection(query, telegram_id, callback_data)

    # Task category selection
    elif callback_data.startswith("category_"):
        await handle_category_selection(query, telegram_id, callback_data)

    # Task actions
    elif callback_data.startswith("task_"):
        await handle_task_detail(query, telegram_id, callback_data)

    # Worker selection
    elif callback_data.startswith("worker_"):
        await handle_worker_detail(query, telegram_id, callback_data)

    # Task assignment
    elif callback_data.startswith("assign_to_"):
        await handle_assign_task(query, telegram_id, callback_data)

    elif callback_data.startswith("assign_task_"):
        await handle_show_workers_for_assignment(query, telegram_id, callback_data)

    # Task status updates
    elif callback_data.startswith("start_task_"):
        await handle_start_task(query, telegram_id, callback_data)

    elif callback_data.startswith("decline_task_"):
        await handle_decline_task(query, telegram_id, callback_data)

    elif callback_data.startswith("complete_task_"):
        await handle_complete_task(query, telegram_id, callback_data)

    elif callback_data.startswith("update_progress_"):
        await handle_request_progress_update(query, telegram_id, callback_data)

    # Rating
    elif callback_data.startswith("rate_task_"):
        # TODO: i don't know how to accept feedback using this aproach!
        # Check if this is a direct rating from notification (rate_task_123_5) or just showing options (rate_task_123)
        parts = callback_data.split("_")
        # TODO: Use regex to parse more cleanly
        if len(parts) == 4:
            await handle_rate_task(query, telegram_id, callback_data)
        else:
            await handle_show_rating_options(query, telegram_id, callback_data)

    elif callback_data.startswith("rate_"):
        await handle_rate_task(query, telegram_id, callback_data)

    # Feedback
    elif callback_data.startswith("add_comment_"):
        await handle_add_comment(query, telegram_id, callback_data)

    # Navigation
    elif callback_data == "back_to_menu":
        user = await get_user_by_telegram_id(telegram_id)
        await query.edit_message_text(
            "Main Menu:", reply_markup=get_main_menu_keyboard(user["role"])
        )

    elif callback_data == "back_to_tasks":
        user = await get_user_by_telegram_id(telegram_id)
        if user["role"] == Role.WORKER:
            await handle_menu_selection(query, telegram_id, "menu_my_tasks")
        else:
            await handle_menu_selection(query, telegram_id, "menu_my_tasks")

    elif callback_data == "skip":
        await handle_skip(query, telegram_id)

    elif callback_data == "cancel":
        await clear_conversation_state(telegram_id)
        user = await get_user_by_telegram_id(telegram_id)
        await query.edit_message_text(
            "Operation cancelled.", reply_markup=get_main_menu_keyboard(user["role"])
        )
    else:
        await query.edit_message_text(
            "Unknown command or action, Use /help for assistance."
        )


async def handle_role_selection(query, telegram_id, callback_data):
    """Handle role selection during registration"""

    role = Role.WORKER if "worker" in callback_data else Role.SUPERVISOR

    if role == Role.WORKER:
        await set_conversation_state(
            telegram_id,
            "AWAITING_CPASS_ONBOARDING",
            {
                "role": role,
                "telegram_id": telegram_id,
                "telegram_username": query.from_user.username or "",
                "started_at": str(query.message.date),
            },
        )

        # TODO: Remove the hardcoded url
        keyboard = [
            [
                InlineKeyboardButton(
                    "Complete Worker Registration",
                    # web_app={
                    #     "url": f"http://localhost:5173/signup/basic-info?telegram_id={telegram_id}"
                    # },
                    web_app={"url": f"https://cpass.linkpc.net/"},
                )
            ],
            [InlineKeyboardButton("Cancel", callback_data="cancel")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await query.edit_message_text(
            "<b>Worker Registration</b>\n\n"
            "As a worker, you'll build your career passport through the CPASS system.\n\n"
            "Click the button below to complete your registration in our app. "
            "This will take about 5 minutes and will help you:\n\n"
            "• Track your skills and experience\n"
            "• Build a portable reputation\n"
            "• Get matched with opportunities\n",
            parse_mode="HTML",
            reply_markup=reply_markup,
        )
    else:
        # For supervisors
        await set_conversation_state(telegram_id, "AWAITING_NAME", {"role": role})

        await query.edit_message_text(
            f"<b>Supervisor Registration</b>\n\n" f"What's your full name?",
            parse_mode="HTML",
        )


async def handle_menu_selection(query, telegram_id, callback_data):
    """Handle main menu button selections"""
    user = await get_user_by_telegram_id(telegram_id)

    if not user:
        await query.edit_message_text("Please use /start to register first!")
        return

    if callback_data == "menu_available_tasks":
        tasks = await get_available_tasks()
        await query.edit_message_text(
            f"<b>Available Tasks</b> ({len(tasks)} tasks)\n\n"
            f"Select a task to view details:",
            parse_mode="HTML",
            reply_markup=get_task_list_keyboard(tasks, prefix="task"),
        )

    elif callback_data == "menu_my_tasks":
        if user["role"] == Role.WORKER:
            tasks = await get_tasks_by_worker(user["id"])
            title = "My Assigned Tasks"
        else:  # Supervisor
            tasks = await get_tasks_by_supervisor(user["id"])
            title = "My Created Tasks"

        await query.edit_message_text(
            f"<b>{title}</b> ({len(tasks)} tasks)\n\n"
            f"Select a task to view details:",
            parse_mode="HTML",
            reply_markup=get_task_list_keyboard(tasks, prefix="task"),
        )

    elif callback_data == "menu_profile":
        # Generate auth token for WebApp
        @sync_to_async
        def get_user_phone():
            try:
                user_obj = User.objects.get(telegram_id=telegram_id)
                return user_obj.phone_number, user_obj
            except User.DoesNotExist:
                return None, None

        phone_number, user_obj = await get_user_phone()
        if phone_number is None or user_obj is None:
            await query.edit_message_text(
                "❌ Unable to retrieve profile. Please ensure your contact information is shared."
            )
            return
        auth_token = generate_auth_token(str(telegram_id), phone_number or "")

        # TODO:
        domain = f"https://cpass.cpass.linkpc.net/worker-profile/{user_obj.id}/"

        keyboard = [
            # [InlineKeyboardButton("👤 View My Profile", web_app={"url": domain})],
            [InlineKeyboardButton("⬅️ Back to Menu", callback_data="menu_back")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await query.edit_message_text(
            "Click the button below to view your profile in the web app:",
            reply_markup=reply_markup,
        )

    elif callback_data == "menu_back":
        # Return to main menu
        await query.edit_message_text(
            "Choose an option:",
            reply_markup=get_main_menu_keyboard(user["role"]),
        )

    elif callback_data == "menu_create_task":
        await set_conversation_state(
            telegram_id, "AWAITING_TASK_TITLE", {"created_by": user["id"]}
        )
        await query.edit_message_text(
            "<b>Create New Task</b>\n\n" "Please enter the task title:",
            parse_mode="HTML",
            reply_markup=get_cancel_keyboard(),
        )

    elif callback_data == "menu_view_workers":
        # TODO: Implement search and pagination
        workers = await get_all_workers()
        await query.edit_message_text(
            f"<b>Available Workers</b> ({len(workers)} workers)\n\n"
            f"Select a worker to view profile:",
            parse_mode="HTML",
            reply_markup=get_worker_list_keyboard(workers),
        )

    elif callback_data == "menu_history":
        tasks = await get_tasks_by_worker(user["id"])
        completed_tasks = [t for t in tasks if t["status"] == "COMPLETED"]
        await query.edit_message_text(
            f"<b>Task History</b> ({len(completed_tasks)} completed)\n\n"
            f"Select a task to view details:",
            parse_mode="HTML",
            reply_markup=get_task_list_keyboard(completed_tasks, prefix="task"),
        )


async def handle_task_detail(query, telegram_id, callback_data):
    """Show task detail"""
    task_id = int(callback_data.split("_")[1])
    task = await get_task_detail(task_id)

    if not task:
        await query.edit_message_text("Task not found.")
        return

    user = await get_user_by_telegram_id(telegram_id)
    task_text = format_task_detail(task)

    await query.edit_message_text(
        task_text,
        parse_mode="HTML",
        reply_markup=get_task_detail_keyboard(task, user["role"]),
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages during conversations"""
    telegram_id = update.effective_user.id
    text = update.message.text

    # Check if contact was verified
    @sync_to_async
    def has_shared_contact():
        return ContactVerification.objects.filter(telegram_id=telegram_id).exists()

    if not await has_shared_contact():
        await update.message.reply_text(
            "⚠️ Please share your contact first to use this bot.\n\n"
            "Use /start to begin.",
            reply_markup=get_contact_request_keyboard(),
        )
        return

    state = await get_conversation_state(telegram_id)
    current_state = state.get("state")
    data = state.get("data", {})

    # Registration
    # TODO: This is not compatible with the CPASS registration yet.
    if current_state == "AWAITING_NAME":
        data["full_name"] = text
        data["telegram_username"] = update.effective_user.username or ""
        data["telegram_id"] = telegram_id

        if data["role"] == Role.WORKER:
            await set_conversation_state(telegram_id, "AWAITING_SKILLS", data)
            await update.message.reply_text(
                "What are your skills?",
                reply_markup=get_skip_button(),
            )
        else:
            await set_conversation_state(telegram_id, "AWAITING_ORGANIZATION", data)
            await update.message.reply_text(
                "What organization do you represent? (optional)",
                reply_markup=get_skip_button(),
            )

    elif current_state == "AWAITING_SKILLS":
        data["skills"] = text
        await set_conversation_state(telegram_id, "AWAITING_BIO", data)
        await update.message.reply_text(
            "Tell us a bit about yourself (optional):", reply_markup=get_skip_button()
        )

    elif current_state == "AWAITING_BIO":
        data["bio"] = text
        await complete_registration(update, telegram_id, data)

    elif current_state == "AWAITING_ORGANIZATION":
        data["organization"] = text
        await complete_registration(update, telegram_id, data)

    # Task creation flow
    elif current_state == "AWAITING_TASK_TITLE":
        data["title"] = text
        await set_conversation_state(telegram_id, "AWAITING_TASK_DESCRIPTION", data)
        await update.message.reply_text(
            "Please enter the task description:", reply_markup=get_cancel_keyboard()
        )

    elif current_state == "AWAITING_TASK_DESCRIPTION":
        data["description"] = text
        await set_conversation_state(telegram_id, "AWAITING_TASK_CATEGORY", data)
        await update.message.reply_text(
            "Select a category for this task:",
            reply_markup=get_task_categories_keyboard(),
        )

    # Progress update flow
    elif current_state == "AWAITING_PROGRESS_UPDATE":
        user = await get_user_by_telegram_id(telegram_id)
        task_id = data.get("task_id")

        result = await add_task_progress(
            task_id, user["id"], text, data.get("progress", 50)
        )

        if result:
            await clear_conversation_state(telegram_id)
            await update.message.reply_text(
                "Progress update saved!",  # TODO: Add emojis!
                reply_markup=get_main_menu_keyboard(user["role"]),
            )
        else:
            await update.message.reply_text(
                "Failed to save progress. Please try again."  # TODO: Add emojis!
            )

    # Rating comment flow
    elif current_state == "AWAITING_RATING_COMMENT":
        # TODO: Refactor, or maybe use a switch case on handle_message and handle cases in separate methods.

        user = await get_user_by_telegram_id(telegram_id)
        task_id = data.get("task_id")

        try:

            @sync_to_async
            def update_rating_comment():
                task = Task.objects.get(id=task_id)
                if hasattr(task, "rating"):
                    rating = task.rating
                    rating.comment = text
                    rating.save()
                    return True
                return False

            result = await update_rating_comment()

            if result:
                await clear_conversation_state(telegram_id)
                await update.message.reply_text(
                    "Feedback added successfully!\n\n"
                    "The worker will see your comments along with the rating.",
                    reply_markup=get_main_menu_keyboard(user["role"]),
                )

                task = await get_task_detail(task_id)

                if task and task.get("assigned_to"):
                    worker = await sync_to_async(User.objects.get)(
                        id=task["assigned_to"]
                    )
                    if worker.telegram_id:
                        # Get the rating to include score and comment
                        @sync_to_async
                        def get_rating_info():
                            task_obj = Task.objects.get(id=task_id)
                            if hasattr(task_obj, "rating"):
                                return task_obj.rating.score, task_obj.rating.comment
                            return None, None

                        score, comment = await get_rating_info()
                        if score:
                            await notify_task_completed(
                                worker_telegram_id=worker.telegram_id,
                                task_title=task["title"],
                                rating=score,
                                comment=comment,
                            )

            else:
                await update.message.reply_text(
                    "Failed to add feedback. The task may not have been rated yet."
                )
        except Exception as e:
            logger.error(f"Error adding rating comment: {e}")
            await clear_conversation_state(telegram_id)
            await update.message.reply_text(
                "Failed to add feedback. Please try again.",
                reply_markup=get_main_menu_keyboard(user["role"]),
            )


async def handle_skip(query, telegram_id):
    """Handle skip button press"""
    state = await get_conversation_state(telegram_id)
    current_state = state.get("state")
    data = state.get("data", {})

    if current_state == "AWAITING_SKILLS":
        data["skills"] = ""
        await set_conversation_state(telegram_id, "AWAITING_BIO", data)
        await query.edit_message_text(
            "Tell us a bit about yourself (optional):", reply_markup=get_skip_button()
        )

    elif current_state == "AWAITING_BIO":
        data["bio"] = ""
        await complete_registration_from_callback(query, telegram_id, data)

    elif current_state == "AWAITING_ORGANIZATION":
        data["organization"] = ""
        await complete_registration_from_callback(query, telegram_id, data)


# TODO: This may not be used anymore since we are using the mini app logic now!
async def complete_registration(update, telegram_id, data):
    """Complete user registration"""

    user = await register_user(data)
    await clear_conversation_state(telegram_id)

    if user:
        role_name = "Worker" if data["role"] == Role.WORKER else "Supervisor"
        message = f"Registration complete!\n\n"
        message += f"Welcome, {data['full_name']}!\n"
        message += f"Role: {role_name}\n\n"

        if data["role"] == Role.SUPERVISOR:
            message += "Your supervisor account is pending verification. "
            message += "An admin will review your request soon."
        else:
            message += "You can now browse available tasks and build your reputation!"

        await update.message.reply_text(
            message, reply_markup=get_main_menu_keyboard(data["role"])
        )
    else:
        await update.message.reply_text(
            "Registration failed. Please try again with /start"
        )


async def complete_registration_from_callback(query, telegram_id, data):
    """Complete registration from callback (skip button)"""
    return await complete_registration(query, telegram_id, data)


async def handle_category_selection(query, telegram_id, callback_data):
    """Handle task category selection"""
    state = await get_conversation_state(telegram_id)
    data = state.get("data", {})

    category = callback_data.replace("category_", "")
    data["category"] = category

    task = await create_task(data)
    await clear_conversation_state(telegram_id)

    if task:
        user = await get_user_by_telegram_id(telegram_id)
        await query.edit_message_text(
            f"Task created successfully!\n\n"
            f"Task #{task['id']}: {task['title']}\n"
            f"Category: {task['category']}\n\n"
            f"You can now assign it to a worker.",
            reply_markup=get_main_menu_keyboard(user["role"]),
        )
    else:
        await query.edit_message_text("Failed to create task. Please try again.")


async def handle_show_workers_for_assignment(query, telegram_id, callback_data):
    """Show list of workers to assign a task"""
    task_id = int(callback_data.replace("assign_task_", ""))
    workers = await get_all_workers()

    await query.edit_message_text(
        f"<b>Select a worker for Task #{task_id}</b>\n\n"
        f"Choose from available workers:",
        parse_mode="HTML",
        reply_markup=get_assign_worker_keyboard(workers, task_id),
    )


async def handle_assign_task(query, telegram_id, callback_data):
    """Handle task assignment to worker"""
    parts = callback_data.split("_")
    task_id = int(parts[2])
    worker_id = int(parts[3])

    result = await assign_task(task_id, worker_id)

    if result:
        await query.edit_message_text(
            f"Task #{task_id} assigned successfully!",
            reply_markup=get_main_menu_keyboard(Role.SUPERVISOR),
        )
    else:
        await query.edit_message_text(f"Failed to assign task. Please try again.")


async def handle_start_task(query, telegram_id, callback_data):
    """Handle starting a task"""
    task_id = int(callback_data.replace("start_task_", ""))
    result = await update_task_status(task_id, "IN_PROGRESS")

    if result:
        await query.edit_message_text(
            f"Task #{task_id} started! You can now update progress.",
            reply_markup=get_main_menu_keyboard(Role.WORKER),
        )
    else:
        await query.edit_message_text(f"Failed to start task. Please try again.")


async def handle_decline_task(query, telegram_id, callback_data):
    """Handle declining a task assignment"""
    task_id = int(callback_data.replace("decline_task_", ""))

    task = await get_task_detail(task_id)
    if not task:
        await query.edit_message_text("Task not found.")
        return

    result = await update_task_status(task_id, "OPEN", unassign=True)

    if result:
        await query.edit_message_text(
            f"You have declined the task: {task['title']}\n\n"
            f"The supervisor has been notified.",
            reply_markup=get_main_menu_keyboard(Role.WORKER),
        )

        # Notify supervisor about the decline
        if task.get("created_by"):

            try:
                supervisor = await sync_to_async(User.objects.get)(
                    id=task["created_by"]
                )
                if supervisor.telegram_id:
                    keyboard = [
                        [
                            InlineKeyboardButton(
                                "View Task", callback_data=f"task_{task_id}"
                            )
                        ]
                    ]

                    await send_telegram_notification(
                        telegram_id=supervisor.telegram_id,
                        message=f"<b>Task Declined</b>\n\n"
                        f"Worker declined the task: {task['title']}\n\n"
                        f"Please reassign to another worker.",
                        parse_mode="HTML",
                        reply_markup=InlineKeyboardMarkup(keyboard),
                    )
            except:
                logger.error(
                    "Supervisor notification failed, but task declined successfully"
                )
                # pass
    else:
        await query.edit_message_text(f"Failed to decline task. Please try again.")


async def handle_complete_task(query, telegram_id, callback_data):
    """Handle marking task as complete"""
    task_id = int(callback_data.replace("complete_task_", ""))
    user = await get_user_by_telegram_id(telegram_id)

    if user["role"] == Role.WORKER:
        result = await update_task_status(task_id, "SUBMITTED")
        message = "Task submitted for review!"
    else:
        result = await update_task_status(task_id, "COMPLETED")
        message = "Task marked as completed!"

    if result:
        await query.edit_message_text(
            message, reply_markup=get_main_menu_keyboard(user["role"])
        )
    else:
        await query.edit_message_text(f"Failed to update task. Please try again.")


async def handle_request_progress_update(query, telegram_id, callback_data):
    """Request progress update text from user"""
    task_id = int(callback_data.replace("update_progress_", ""))

    await set_conversation_state(
        telegram_id, "AWAITING_PROGRESS_UPDATE", {"task_id": task_id}
    )

    await query.edit_message_text(
        f"<b>Update Progress for Task #{task_id}</b>\n\n"
        f"Please describe what you've done:",
        parse_mode="HTML",
    )


async def handle_show_rating_options(query, telegram_id, callback_data):
    """Show rating options"""
    task_id = int(callback_data.replace("rate_task_", ""))

    await query.edit_message_text(
        f"<b>Rate Task #{task_id}</b>\n\n" f"How would you rate this work?",
        parse_mode="HTML",
        reply_markup=get_rating_keyboard(task_id),
    )


async def handle_rate_task(query, telegram_id, callback_data):
    """Handle task rating"""
    parts = callback_data.split("_")

    if callback_data.startswith("rate_task_"):
        task_id = int(parts[2])
        score = int(parts[3])
    else:
        # TODO: I should remove this old format support later
        # Format: rate_123_5 (old format)
        task_id = int(parts[1])
        score = int(parts[2])

    user = await get_user_by_telegram_id(telegram_id)

    # TODO: Debug logging
    logger.info(
        f"Rating task {task_id} with score {score} by user {user['id']} (role: {user['role']})"
    )

    result = await rate_task(task_id, user["id"], score, "")

    if result:
        stars = "⭐" * score

        keyboard = [
            [
                InlineKeyboardButton(
                    "💬 Add Feedback", callback_data=f"add_comment_{task_id}"
                )
            ],
            # [InlineKeyboardButton("🏠 Main Menu", callback_data="back_to_menu")],
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await query.edit_message_text(
            f"<b>Task Rated Successfully!</b>\n\n"
            f"<b>Rating:</b> {stars} ({score}/5)\n\n"
            f"The worker has been notified of their rating.\n"
            f"You can optionally add feedback comments.",
            parse_mode="HTML",
            reply_markup=reply_markup,
        )
    else:
        logger.error(f"Failed to rate task {task_id} - result was None")
        await query.edit_message_text(f"Failed to rate task. Please try again.")


async def handle_add_comment(query, telegram_id, callback_data):
    """Handle request to add comment/feedback to rating"""
    task_id = int(callback_data.replace("add_comment_", ""))

    await set_conversation_state(
        telegram_id, "AWAITING_RATING_COMMENT", {"task_id": task_id}
    )

    await query.edit_message_text(
        f"<b>Add Feedback</b>\n\n"
        f"Please type your feedback comment for this task:\n\n"
        f"<i>(This will be shared with the worker)</i>",
        parse_mode="HTML",
    )


async def handle_worker_detail(query, telegram_id, callback_data):
    """Show worker profile detail"""
    worker_id = int(callback_data.replace("worker_", ""))

    try:
        worker = User.objects.select_related("worker_profile").get(
            id=worker_id, user_type="worker"
        )
        worker_data = serialize_user(worker)
        profile_text = format_profile(worker_data)
        await query.edit_message_text(
            profile_text,
            parse_mode="HTML",
            reply_markup=get_main_menu_keyboard(Role.SUPERVISOR),
        )
    except User.DoesNotExist:
        await query.edit_message_text("Worker not found.")
    except Exception as e:
        logger.error(f"Error fetching worker: {e}")
        await query.edit_message_text("Error loading worker profile.")
