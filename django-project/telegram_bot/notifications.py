"""
Telegram notification utilities for sending messages to users
"""

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup
from django.conf import settings

import logging

logger = logging.getLogger(__name__)


async def send_telegram_notification(
    telegram_id: int, message: str, parse_mode: str = None, reply_markup=None
):
    """Send a notification message to a user via Telegram"""

    try:
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

        await bot.send_message(
            chat_id=telegram_id,
            text=message,
            parse_mode=parse_mode,
            reply_markup=reply_markup,
        )

        logger.info(f"Notification sent to user {telegram_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send notification to {telegram_id}: {str(e)}")
        return False


async def notify_task_assigned(
    worker_telegram_id: int, task_title: str, supervisor_name: str, task_id: int
):
    """Notify a worker that they have been assigned a new task"""

    message = f"""
🎯 <b>New Task Assigned!</b>

<b>Task:</b> {task_title}
<b>Assigned by:</b> {supervisor_name}

What would you like to do?
"""

    keyboard = [
        [
            InlineKeyboardButton("▶️ Start Task", callback_data=f"start_task_{task_id}"),
            InlineKeyboardButton("❌ Decline", callback_data=f"decline_task_{task_id}"),
        ],
        [InlineKeyboardButton("📋 View Details", callback_data=f"task_{task_id}")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    return await send_telegram_notification(
        telegram_id=worker_telegram_id,
        message=message,
        parse_mode="HTML",
        reply_markup=reply_markup,
    )


async def notify_task_status_updated(
    supervisor_telegram_id: int,
    task_title: str,
    worker_name: str,
    new_status: str,
    task_id: int = None,
):
    """Notify a supervisor that a task status has been updated"""

    status_emoji = {
        "IN_PROGRESS": "🔄",
        "SUBMITTED": "✅",
        "COMPLETED": "🎉",
        "CANCELLED": "❌",
    }

    emoji = status_emoji.get(new_status, "")

    message = f"""
{emoji} <b>Task Status Updated</b>

<b>Task:</b> {task_title}
<b>Worker:</b> {worker_name}
<b>New Status:</b> {new_status.replace('_', ' ').title()}
"""

    keyboard = []

    if new_status == "SUBMITTED" and task_id:
        message += "\n<i>✨ Ready for your review!</i>"
        keyboard.append(
            [InlineKeyboardButton("📋 View Details", callback_data=f"task_{task_id}")]
        )
        message += "\n<i>⭐ Please rate this worker's performance:</i>"

        keyboard.append(
            [
                InlineKeyboardButton("⭐", callback_data=f"rate_task_{task_id}_1"),
                InlineKeyboardButton("⭐⭐", callback_data=f"rate_task_{task_id}_2"),
                InlineKeyboardButton("⭐⭐⭐", callback_data=f"rate_task_{task_id}_3"),
            ]
        )
        keyboard.append(
            [
                InlineKeyboardButton(
                    "⭐⭐⭐⭐", callback_data=f"rate_task_{task_id}_4"
                ),
                InlineKeyboardButton(
                    "⭐⭐⭐⭐⭐", callback_data=f"rate_task_{task_id}_5"
                ),
            ]
        )
        keyboard.append(
            [InlineKeyboardButton("📋 View Details", callback_data=f"task_{task_id}")]
        )
    elif task_id:
        keyboard.append(
            [InlineKeyboardButton("📋 View Details", callback_data=f"task_{task_id}")]
        )

    reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None

    return await send_telegram_notification(
        telegram_id=supervisor_telegram_id,
        message=message,
        parse_mode="HTML",
        reply_markup=reply_markup,
    )


async def notify_task_completed(
    worker_telegram_id: int, task_title: str, rating: float = None, comment: str = None
):
    """Notify a worker that their task has been marked as completed"""

    message = f"""
🎉 <b>Task Completed!</b>

<b>Task:</b> {task_title}
"""

    if rating:
        message += f"\n<b>Rating:</b> {'⭐' * int(rating)} ({rating}/5.0)"

    if comment:
        message += f'\n\n💬 <b>Supervisor Feedback:</b>\n<i>"{comment}"</i>'

    print("notification: ", message)
    return await send_telegram_notification(
        telegram_id=worker_telegram_id, message=message, parse_mode="HTML"
    )
