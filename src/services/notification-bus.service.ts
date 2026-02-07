// src/services/notification-bus.service.ts
import { ref } from 'vue'

interface NotificationEvent {
  title: string
  body: string
  timestamp: number
}

const notificationEvent = ref<NotificationEvent | null>(null)

export const useNotificationBus = () => {
  const triggerNotification = (title: string, body: string) => {
    notificationEvent.value = {
      title,
      body,
      timestamp: Date.now()
    }
  }

  const clearNotification = () => {
    notificationEvent.value = null
  }

  return {
    notificationEvent,
    triggerNotification,
    clearNotification
  }
}