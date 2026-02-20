import React, { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Send, Sparkles, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const palette = {
  bg0: "#070A12",
  bg1: "#0B1022",
  text: "#F5F7FF",
  textFaint: "rgba(245,247,255,0.58)",
  teal: "#1FD6C1",
  blue: "#4AA3FF",
  gold: "#F8C46C",
} as const;

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

function generateAIResponse(userMsg: string): string {
  const lowercaseMsg = userMsg.toLowerCase();

  if (lowercaseMsg.includes('anxious') || lowercaseMsg.includes('anxiety') || lowercaseMsg.includes('worried')) {
    return "I hear that you're feeling anxious. That's completely valid. Have you noticed what triggers this feeling? Sometimes identifying patterns can help us address them. Would breathing exercises or grounding techniques help you right now?";
  }
  if (lowercaseMsg.includes('stressed') || lowercaseMsg.includes('stress') || lowercaseMsg.includes('overwhelmed')) {
    return "Stress can be so overwhelming. Remember to be gentle with yourself. What's been weighing on your mind lately? Sometimes breaking things down into smaller pieces makes them more manageable.";
  }
  if (lowercaseMsg.includes('sad') || lowercaseMsg.includes('down') || lowercaseMsg.includes('depressed')) {
    return "I'm sorry you're going through this. Sadness is a natural part of being human. Would you like to talk about what's bringing these feelings up? I'm here to listen without judgment.";
  }
  if (lowercaseMsg.includes('happy') || lowercaseMsg.includes('good') || lowercaseMsg.includes('great') || lowercaseMsg.includes('better')) {
    return "That's wonderful to hear! What's been contributing to these positive feelings? Acknowledging and celebrating our joy is just as important as processing difficult emotions.";
  }
  if (lowercaseMsg.includes('angry') || lowercaseMsg.includes('frustrated') || lowercaseMsg.includes('mad')) {
    return "Anger often shows up when something important to us is being challenged. What's underneath that anger for you? Sometimes it helps to explore what needs aren't being met.";
  }
  if (lowercaseMsg.includes('calm') || lowercaseMsg.includes('peaceful') || lowercaseMsg.includes('relaxed')) {
    return "Finding moments of calm is so valuable. What practices or experiences help you tap into this peaceful state? Building on what works can deepen your sense of tranquility.";
  }
  if (lowercaseMsg.includes('tired') || lowercaseMsg.includes('exhausted') || lowercaseMsg.includes('drained')) {
    return "Rest is essential for healing and growth. Are you getting enough quality sleep? Sometimes our bodies are telling us we need to slow down and recharge. What would genuine rest look like for you?";
  }
  if (lowercaseMsg.includes('session') || lowercaseMsg.includes('practice') || lowercaseMsg.includes('meditation')) {
    return "It sounds like you're interested in your practice! Consistency is more important than perfection. How has your journey with the sessions been so far? What changes have you noticed?";
  }
  if (lowercaseMsg.length < 10) {
    return "I'd love to hear more about that. Can you tell me what's going on? The more you share, the better I can support you.";
  }
  return "Thank you for sharing that with me. Your feelings are valid and important. How long have you been experiencing this? Sometimes understanding the timeline helps us see patterns and progress.";
}

export default React.memo(function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! I'm here to support you on your journey. How are you feeling today?" },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setChatMessages((prev) => [...prev, { role: "user", text: trimmedMessage }]);
    setUserMessage("");
    setIsAITyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(trimmedMessage);
      setChatMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
      setIsAITyping(false);
    }, 1200);
  }, [userMessage]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.chatModalOverlay}>
        <View style={styles.chatModalContent}>
          <LinearGradient
            colors={[palette.bg0, palette.bg1, "#071A24"]}
            style={styles.chatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.chatGlowTopRight} pointerEvents="none" />
            <View style={styles.chatGlowBottomLeft} pointerEvents="none" />
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderInfo}>
                <View style={styles.aiAvatarContainer}>
                  <Sparkles size={18} color={palette.bg0} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>Wellness Companion</Text>
                  <Text style={styles.chatHeaderSubtitle}>Reflect, release, and re-center</Text>
                </View>
              </View>
              <TouchableOpacity
                testID="closeAIChat"
                onPress={onClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                style={styles.chatCloseButton}
              >
                <X size={20} color={palette.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.chatMessagesContainer}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.map((message, index) => (
                <View
                  key={`chat-msg-${index}`}
                  style={[
                    styles.chatMessageBubble,
                    message.role === "user" ? styles.chatMessageUser : styles.chatMessageAI,
                  ]}
                >
                  {message.role === "ai" && (
                    <View style={styles.aiMessageIcon}>
                      <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
                    </View>
                  )}
                  <View style={[
                    styles.chatBubbleContent,
                    message.role === "user" ? styles.chatBubbleUser : styles.chatBubbleAI,
                  ]}>
                    <Text style={[
                      styles.chatMessageText,
                      message.role === "user" && styles.chatMessageTextUser,
                    ]}>
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
              {isAITyping && (
                <View style={[styles.chatMessageBubble, styles.chatMessageAI]}>
                  <View style={styles.aiMessageIcon}>
                    <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
                  </View>
                  <View style={[styles.chatBubbleContent, styles.chatBubbleAI]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                testID="chatInput"
                style={styles.chatInput}
                value={userMessage}
                onChangeText={setUserMessage}
                placeholder="Share how you're feeling..."
                placeholderTextColor={"rgba(245,247,255,0.45)"}
                multiline
                maxLength={500}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                testID="sendMessage"
                onPress={handleSendMessage}
                style={[
                  styles.sendButton,
                  !userMessage.trim() && styles.sendButtonDisabled,
                ]}
                disabled={!userMessage.trim() || isAITyping}
              >
                <LinearGradient
                  colors={
                    userMessage.trim()
                      ? [palette.teal, palette.blue]
                      : ["rgba(255,255,255,0.14)", "rgba(255,255,255,0.10)"]
                  }
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Send size={18} color={userMessage.trim() ? palette.bg0 : "rgba(245,247,255,0.45)"} strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  chatModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  chatModalContent: {
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  chatGradient: {
    flex: 1,
    paddingTop: 20,
  },
  chatGlowTopRight: {
    position: "absolute",
    top: -120,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 260,
    backgroundColor: "rgba(74,163,255,0.22)",
    transform: [{ rotate: "18deg" }],
  },
  chatGlowBottomLeft: {
    position: "absolute",
    bottom: -180,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 320,
    backgroundColor: "rgba(31,214,193,0.16)",
    transform: [{ rotate: "-10deg" }],
  },
  chatCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(147,51,234,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#9333ea",
  },
  chatHeaderTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  chatHeaderSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 20,
    gap: 16,
  },
  chatMessageBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  chatMessageAI: {
    alignSelf: "flex-start",
  },
  chatMessageUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  aiMessageIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(147,51,234,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  chatBubbleContent: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 14,
  },
  chatBubbleAI: {
    backgroundColor: "rgba(147,51,234,0.12)",
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.2)",
  },
  chatBubbleUser: {
    backgroundColor: "#14b8a6",
  },
  chatMessageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },
  chatMessageTextUser: {
    color: "#0b1220",
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9333ea",
    opacity: 0.6,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
