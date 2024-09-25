import { getAIAuth } from '../../components/OpenAuth/useOpenAuth';
import { storage } from '../storage';
import { getNavigator } from '../../useNavigator';
import { Chat } from './settings';

/**
 * sortedSet: {
 *  `user:chat:${userId}`: [{score: now, member: `chat:${id}`}, ...]
 * }
 * hash: {
 *  `chat:${id}`: {
 *    id,
 *    userId,
 *    createdAt,
 *    path,
 *    messags
 *    sharePath
 *  }
 * }
 */
export async function getChats(userId?: string | null) {
  if (!userId) {
    return [];
  }

  try {
    const chats = await storage.getItem<string[]>(`user:chat:${userId}`);
    if (chats) {
      const results = await Promise.all(
        chats.map(async (chatId) => {
          const map = await storage.getItem<Chat>(chatId);
          return map;
        })
      );
      return results;
    }
    return [];
  } catch (error) {
    return [];
  }
}

export async function getChat(id: string, userId: string) {
  const chat = await storage.getItem<Chat>(`chat:${id}`);

  if (!chat || (userId && chat.userId !== userId)) {
    return null;
  }

  return chat;
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const auth = await getAIAuth();
  const navigator = getNavigator();
  const userId = auth?.user?.id;
  const chatId = `chat:${id}`;
  if (!userId) {
    return {
      error: 'Unauthorized',
    };
  }

  // Convert uid to string for consistent comparison with userId
  const chat = await storage.getItem<Chat>(chatId);

  if (chat?.userId !== userId) {
    return {
      error: 'Unauthorized',
    };
  }

  const chats = await storage.getItem<string[]>(`user:chat:${userId}`);
  await storage.removeItem(chatId);
  if (chats) {
    await storage.setItem(
      `user:chat:${userId}`,
      chats.filter((_id) => _id !== chatId)
    );
  }

  return navigator.replace(path);
}

export async function clearChats() {
  const auth = await getAIAuth();
  const navigator = getNavigator();
  const userId = auth?.user?.id;
  if (!userId) {
    return {
      error: 'Unauthorized',
    };
  }

  const chats = await storage.getItem<string[]>(`user:chat:${userId}`);

  if (!chats?.length) {
    return navigator.push('/aiweb/playground');
  }

  chats.forEach(async (chatId) => {
    await storage.removeItem(chatId);
  });
  await storage.removeItem(`user:chat:${userId}`);
  return navigator.push('/aiweb/playground');
}

export async function getSharedChat(id: string) {
  const chat = await storage.getItem<Chat>(`chat:${id}`);

  if (!chat || !chat.sharePath) {
    return null;
  }

  return chat;
}

export async function shareChat(id: string) {
  const auth = await getAIAuth();
  const userId = auth?.user?.id;
  if (!userId) {
    return {
      error: 'Unauthorized',
    };
  }

  const chat = await storage.getItem<Chat>(`chat:${id}`);

  if (!chat || chat.userId !== userId) {
    return {
      error: 'Something went wrong',
    };
  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`,
  };

  await storage.setItem(`chat:${chat.id}`, payload);

  return payload;
}

export async function saveChat(chat: Chat) {
  if (chat.userId) {
    const chats = await storage.getItem<string[]>(`user:chat:${chat.userId}`);
    await storage.setItem(`chat:${chat.id}`, chat);
    await storage.setItem(
      `user:chat:${chat.userId}`,
      chats ? chats.concat(`chat:${chat.id}`) : [`chat:${chat.id}`]
    );
  }
}
