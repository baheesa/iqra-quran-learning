import { randomUUID } from "crypto";

import type {
  ConversationMessageRecord,
  ConversationRecord,
  FeedbackRecord,
  KnowledgeReference,
  TeacherContext,
  TeacherIntent,
  TeacherMessageRole,
} from "@/features/teacher/types";

export type ConversationRepository = {
  listConversations(learnerId: string): ConversationRecord[];
  getConversation(id: string): ConversationRecord | null;
  saveConversation(conversation: ConversationRecord): void;
  addMessage(
    conversationId: string,
    message: ConversationMessageRecord,
  ): ConversationRecord;
  addFeedback(feedback: FeedbackRecord): void;
  reset(): void;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function createMemoryConversationRepository(): ConversationRepository {
  const conversations = new Map<string, ConversationRecord>();
  const feedback = new Map<string, FeedbackRecord>();

  return {
    listConversations(learnerId) {
      return [...conversations.values()]
        .filter((item) => item.learnerId === learnerId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    getConversation(id) {
      return conversations.get(id)
        ? structuredClone(conversations.get(id)!)
        : null;
    },

    saveConversation(conversation) {
      conversations.set(conversation.id, structuredClone(conversation));
    },

    addMessage(conversationId, message) {
      const existing = conversations.get(conversationId);
      if (!existing) {
        throw new Error(`Unknown conversation: ${conversationId}`);
      }
      const updated: ConversationRecord = {
        ...existing,
        messages: [...existing.messages, message],
        updatedAt: nowIso(),
      };
      conversations.set(conversationId, updated);
      return structuredClone(updated);
    },

    addFeedback(record) {
      feedback.set(record.messageId, structuredClone(record));
    },

    reset() {
      conversations.clear();
      feedback.clear();
    },
  };
}

export function createConversationService(
  repo: ConversationRepository,
  learnerId: string,
) {
  return {
    list() {
      return repo.listConversations(learnerId);
    },

    get(id: string) {
      return repo.getConversation(id);
    },

    ensure(conversationId?: string | null, title?: string | null) {
      if (conversationId) {
        const existing = repo.getConversation(conversationId);
        if (existing) {
          return existing;
        }
      }
      const now = nowIso();
      const created: ConversationRecord = {
        id: randomUUID(),
        learnerId,
        title: title ?? null,
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      repo.saveConversation(created);
      return created;
    },

    append(input: {
      conversationId: string;
      role: TeacherMessageRole;
      intent: TeacherIntent;
      content: string;
      contextSnapshot?: TeacherContext | null;
      knowledgeRefs?: KnowledgeReference[];
      promptVersion?: string | null;
      provider?: string | null;
    }): ConversationMessageRecord {
      const now = nowIso();
      const message: ConversationMessageRecord = {
        id: randomUUID(),
        conversationId: input.conversationId,
        role: input.role,
        intent: input.intent,
        content: input.content,
        contextSnapshot: input.contextSnapshot ?? null,
        knowledgeRefs: input.knowledgeRefs ?? [],
        promptVersion: input.promptVersion ?? null,
        provider: input.provider ?? null,
        createdAt: now,
        updatedAt: now,
      };
      repo.addMessage(input.conversationId, message);
      return message;
    },

    recordFeedback(input: {
      messageId: string;
      helpful?: boolean | null;
      note?: string | null;
    }) {
      const record: FeedbackRecord = {
        id: randomUUID(),
        messageId: input.messageId,
        helpful: input.helpful ?? null,
        note: input.note ?? null,
        createdAt: nowIso(),
      };
      repo.addFeedback(record);
      return record;
    },
  };
}

export type ConversationService = ReturnType<typeof createConversationService>;
