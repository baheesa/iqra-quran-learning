import fs from "fs";
import path from "path";

import {
  createMemoryConversationRepository,
  type ConversationRepository,
} from "@/features/teacher/services/conversation-service";
import type { ConversationRecord } from "@/features/teacher/types";

const DEFAULT_DIR = "data/teacher";

export function createFileConversationRepository(options?: {
  rootDir?: string;
  learnerId?: string;
}): ConversationRepository {
  const learnerId = options?.learnerId ?? "local-learner";
  const filePath = path.join(
    options?.rootDir ?? process.cwd(),
    DEFAULT_DIR,
    `${learnerId}.json`,
  );

  const memory = createMemoryConversationRepository();

  function load(): void {
    try {
      if (!fs.existsSync(filePath)) {
        return;
      }
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
        conversations: ConversationRecord[];
      };
      for (const conversation of raw.conversations ?? []) {
        memory.saveConversation(conversation);
      }
    } catch {
      // start empty
    }
  }

  function persist(): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const conversations = memory.listConversations(learnerId);
    fs.writeFileSync(
      filePath,
      JSON.stringify({ conversations }, null, 2),
      "utf8",
    );
  }

  load();

  return {
    listConversations(id) {
      return memory.listConversations(id);
    },
    getConversation(id) {
      return memory.getConversation(id);
    },
    saveConversation(conversation) {
      memory.saveConversation(conversation);
      persist();
    },
    addMessage(conversationId, message) {
      const updated = memory.addMessage(conversationId, message);
      persist();
      return updated;
    },
    addFeedback(feedback) {
      memory.addFeedback(feedback);
      persist();
    },
    reset() {
      memory.reset();
      persist();
    },
  };
}
