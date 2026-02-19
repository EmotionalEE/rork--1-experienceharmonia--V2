import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";

import Svg, { Circle, Polygon, Path, G } from "react-native-svg";
import { User, Crown, Sparkles, MessageCircle, X, Send, Check } from "lucide-react-native";
import { emotionalStates, sessions } from "@/constants/sessions";
import { useUserProgress } from "@/providers/UserProgressProvider";
import { useVibroacoustic } from "@/providers/VibroacousticProvider";
import { EmotionalState, Session } from "@/types/session";
import * as Haptics from "expo-haptics";

const palette = {
  bg0: "#070A12",
  bg1: "#0B1022",
  card: "rgba(255,255,255,0.08)",
  card2: "rgba(255,255,255,0.10)",
  stroke: "rgba(255,255,255,0.14)",
  strokeStrong: "rgba(255,255,255,0.22)",
  text: "#F5F7FF",
  textDim: "rgba(245,247,255,0.78)",
  textFaint: "rgba(245,247,255,0.58)",
  teal: "#1FD6C1",
  blue: "#4AA3FF",
  gold: "#F8C46C",
} as const;

const AnimatedPressable = React.memo(function AnimatedPressable({
  children,
  onPress,
  disabled,
  testID,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: Platform.OS !== "web",
      speed: 18,
      bounciness: 6,
    }).start();
  }, [scale]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      speed: 18,
      bounciness: 6,
    }).start();
  }, [scale]);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { hasSeenWelcome, hasCompletedOnboarding } = useUserProgress();
  const { triggerHapticPattern } = useVibroacoustic();
  const scrollRef = useRef<ScrollView | null>(null);
  const [emotionsSectionY, setEmotionsSectionY] = useState<number>(0);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | null>(null);
  const [targetEmotionId, setTargetEmotionId] = useState<string | null>(null);
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);
  const iconSpin = useMemo(() => new Animated.Value(0), []);
  const iconPulse = useMemo(() => new Animated.Value(0), []);
  const sessionIconAnims = useMemo(() => {
    return sessions.map(() => ({
      rotate: new Animated.Value(0),
      scale: new Animated.Value(1),
    }));
  }, []);

  const handleEmotionSelect = useCallback(async (emotion: EmotionalState) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await triggerHapticPattern('gentle_pulse');
    }
    setSelectedEmotion(emotion);
    setTargetEmotionId(null);
  }, [triggerHapticPattern]);

  const handleDailyCheckInPress = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    router.push({
      pathname: "/journal-entry" as any,
      params: { date: todayIso },
    });
  }, [router]);

  const handleChooseStatePress = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scrollRef.current?.scrollTo({ y: emotionsSectionY, animated: true });
  }, [emotionsSectionY]);

  const handleSessionPress = useCallback(async (session: Session) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await triggerHapticPattern('rhythmic_wave');
    }

    router.push({
      pathname: "/session" as any,
      params: { sessionId: session.id },
    });
  }, [router, triggerHapticPattern]);

  const handleOpenAIChat = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          role: 'ai',
          text: "Hello! I'm here to support you on your journey. How are you feeling today?",
        },
      ]);
    }
    setShowAIChatModal(true);
  }, [chatMessages.length]);

  const generateAIResponse = useCallback((userMsg: string): string => {
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
  }, []);

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage) return;
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newUserMessage = { role: 'user' as const, text: trimmedMessage };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setUserMessage("");
    setIsAITyping(true);

    setTimeout(() => {
      const aiResponse = generateAIResponse(trimmedMessage);
      setChatMessages((prev) => [...prev, { role: 'ai' as const, text: aiResponse }]);
      setIsAITyping(false);
    }, 1200);
  }, [userMessage, generateAIResponse]);

  const getEmotionIconById = useCallback((emotionId: string, color: string = "#fff") => {
    const geometryIcons: Record<string, React.ReactNode> = {
      anxious: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Circle cx={12} cy={12} r={9.5} fill="none" stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={5} fill="none" stroke={color} strokeWidth={1} />
            <Path d="M12 4 L16 8 L12 12 L8 8 Z" fill="none" stroke={color} strokeWidth={1} />
            <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
            {Array.from({ length: 4 }).map((_, i) => {
              const angle = (i * 90) * Math.PI / 180;
              const r = 12.2;
              const size = 1.4;
              const cx = 12 + Math.cos(angle) * r;
              const cy = 12 + Math.sin(angle) * r;
              return (
                <Polygon key={`anx-spark-${i}`} points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`} fill={color} opacity={0.6} />
              );
            })}
          </G>
        </Svg>
      ),
      stressed: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Polygon points="12,2 22,20 2,20" fill="none" stroke={color} strokeWidth={1.6} />
            <Circle cx={12} cy={14} r={3.6} fill="none" stroke={color} strokeWidth={1} />
            <Path d="M12 8 L15 11 L12 14 L9 11 Z" fill="none" stroke={color} strokeWidth={1} />
            <Path d="M4 6 L20 6" stroke={color} strokeOpacity={0.25} strokeWidth={0.8} strokeDasharray="3,2" />
            <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
          </G>
        </Svg>
      ),
      sad: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.95}>
            {Array.from({ length: 3 }).map((_, i) => {
              const r = 4 + i * 3;
              const w = 0.6 + i * 0.2;
              const dash = i % 2 === 0 ? '3,2' : undefined;
              return (
                <Circle
                  key={i}
                  cx={12}
                  cy={12}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.85}
                  strokeWidth={w}
                  strokeDasharray={dash}
                />
              );
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * Math.PI) / 3;
              const cx = 12 + 5.2 * Math.cos(angle);
              const cy = 12 + 5.2 * Math.sin(angle);
              return (
                <Circle key={`f${i}`} cx={cx} cy={cy} r={4.8} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={0.6} />
              );
            })}
            <Polygon points="12,8 14,13 10,13" fill="none" stroke={color} strokeWidth={0.8} opacity={0.75} />
            <Polygon points="12,16 14,11 10,11" fill="none" stroke={color} strokeWidth={0.8} opacity={0.6} />
            <Circle cx={12} cy={12} r={1.1} fill={color} />
            {Array.from({ length: 4 }).map((_, i) => {
              const angle = (i * 90 + 45) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 7;
              const y1 = 12 + Math.sin(angle) * 7;
              const x2 = 12 + Math.cos(angle) * 9.5;
              const y2 = 12 + Math.sin(angle) * 9.5;
              return <Path key={`sad-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.25} strokeWidth={0.8} />;
            })}
          </G>
        </Svg>
      ),
      angry: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Polygon points="12,2 20,8 20,16 12,22 4,16 4,8" fill="none" stroke={color} strokeWidth={1.6} />
            <Polygon points="12,6 16,10 12,14 8,10" fill="none" stroke={color} strokeWidth={1.1} />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 6.5;
              const y1 = 12 + Math.sin(angle) * 6.5;
              const x2 = 12 + Math.cos(angle) * 10.5;
              const y2 = 12 + Math.sin(angle) * 10.5;
              return <Path key={`ang-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.35} strokeWidth={1} />;
            })}
          </G>
        </Svg>
      ),
      calm: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Circle cx={12} cy={12} r={10.8} fill="none" stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={7} fill="none" stroke={color} strokeWidth={1} />
            <Circle cx={12} cy={12} r={2.4} fill="none" stroke={color} strokeWidth={1} />
            <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 8.5;
              const y1 = 12 + Math.sin(angle) * 8.5;
              const x2 = 12 + Math.cos(angle) * 9.5;
              const y2 = 12 + Math.sin(angle) * 9.5;
              return <Path key={`calm-wave-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.2} strokeWidth={0.8} />;
            })}
          </G>
        </Svg>
      ),
      inspired: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.98}>
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * Math.PI / 180;
              const inner = 2.6;
              const isLong = i % 2 === 0;
              const outer = isLong ? 12.4 : 9.2;
              const x1 = 12 + Math.cos(angle) * inner;
              const y1 = 12 + Math.sin(angle) * inner;
              const x2 = 12 + Math.cos(angle) * outer;
              const y2 = 12 + Math.sin(angle) * outer;
              const w = isLong ? 1.3 : 0.9;
              return (
                <Path
                  key={`ray-${i}`}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={color}
                  strokeOpacity={isLong ? 0.95 : 0.7}
                  strokeWidth={w}
                />
              );
            })}
            <Circle cx={12} cy={12} r={3.6} fill="none" stroke={color} strokeOpacity={0.95} strokeWidth={1.5} />
            <Polygon
              points="12,9.6 12.8,11.2 14.4,12 12.8,12.8 12,14.4 11.2,12.8 9.6,12 11.2,11.2"
              fill="none"
              stroke={color}
              strokeOpacity={0.95}
              strokeWidth={1}
            />
            <Circle cx={12} cy={12} r={1} fill={color} />
            <Circle cx={12} cy={12} r={14} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const r = 13.4;
              const size = 1.6;
              const cx = 12 + Math.cos(angle) * r;
              const cy = 12 + Math.sin(angle) * r;
              return (
                <Polygon
                  key={`spark-${i}`}
                  points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
                  fill={color}
                  opacity={0.85}
                />
              );
            })}
          </G>
        </Svg>
      ),
      happy: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.95}>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 6.8;
              const y1 = 12 + Math.sin(angle) * 6.8;
              const x2 = 12 + Math.cos(angle) * 11.2;
              const y2 = 12 + Math.sin(angle) * 11.2;
              return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeWidth={1.1} />;
            })}
            <Circle cx={12} cy={12} r={4.5} fill="none" stroke={color} strokeWidth={1.5} />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              const r = 13;
              const size = 1.2;
              const cx = 12 + Math.cos(angle) * r;
              const cy = 12 + Math.sin(angle) * r;
              return (
                <Circle key={`happy-dot-${i}`} cx={cx} cy={cy} r={size / 2} fill={color} opacity={0.7} />
              );
            })}
          </G>
        </Svg>
      ),
      energized: (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Polygon points="12,2 18,8 18,16 12,22 6,16 6,8" fill="none" stroke={color} strokeWidth={1.6} />
            <Polygon points="12,6 15,9 15,15 12,18 9,15 9,9" fill="none" stroke={color} strokeWidth={1.1} />
            <Circle cx={12} cy={12} r={2.2} fill={color} />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 5.5;
              const y1 = 12 + Math.sin(angle) * 5.5;
              const x2 = 12 + Math.cos(angle) * 11.5;
              const y2 = 12 + Math.sin(angle) * 11.5;
              return <Path key={`en-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.4} strokeWidth={1.1} />;
            })}
          </G>
        </Svg>
      ),
    };
    
    return geometryIcons[emotionId] || (
      <Svg width={32} height={32} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10} fill="none" stroke={color} strokeWidth={1.5} />
        <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
      </Svg>
    );
  }, []);

  const getSessionIcon = useCallback((session: Session) => {
    const emotionId = session.targetEmotions[0];
    if (session.id === '741hz-detox') {
      return (
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <G opacity={1}>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 6.8;
              const y1 = 12 + Math.sin(angle) * 6.8;
              const x2 = 12 + Math.cos(angle) * 11.2;
              const y2 = 12 + Math.sin(angle) * 11.2;
              return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#ffffff" strokeWidth={1.8} strokeOpacity={1} />;
            })}
            <Circle cx={12} cy={12} r={4.5} fill="none" stroke="#ffffff" strokeWidth={2} strokeOpacity={1} />
            <Circle cx={12} cy={12} r={8} fill="none" stroke="#ffffff" strokeWidth={0.8} strokeOpacity={0.4} />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              const r = 13;
              const size = 1.6;
              const cx = 12 + Math.cos(angle) * r;
              const cy = 12 + Math.sin(angle) * r;
              return (
                <Circle key={`happy-dot-${i}`} cx={cx} cy={cy} r={size / 2} fill="#ffffff" opacity={1} />
              );
            })}
          </G>
        </Svg>
      );
    }
    return getEmotionIconById(emotionId);
  }, [getEmotionIconById]);

  const getEmotionIconWithSmallerSize = useCallback((emotion: EmotionalState, color: string = "#fff") => {
    const geometryIcons: Record<string, React.ReactNode> = {
      anxious: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Circle cx={12} cy={12} r={9.5} fill="none" stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={5} fill="none" stroke={color} strokeWidth={1} />
            <Path d="M12 4 L16 8 L12 12 L8 8 Z" fill="none" stroke={color} strokeWidth={1} />
            <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
            {Array.from({ length: 4 }).map((_, i) => {
              const angle = (i * 90) * Math.PI / 180;
              const r = 12.2;
              const size = 1.4;
              const cx = 12 + Math.cos(angle) * r;
              const cy = 12 + Math.sin(angle) * r;
              return (
                <Polygon key={`anx-spark-${i}`} points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`} fill={color} opacity={0.6} />
              );
            })}
          </G>
        </Svg>
      ),
      stressed: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Polygon points="12,2 22,20 2,20" fill="none" stroke={color} strokeWidth={1.6} />
            <Circle cx={12} cy={14} r={3.6} fill="none" stroke={color} strokeWidth={1} />
            <Path d="M12 8 L15 11 L12 14 L9 11 Z" fill="none" stroke={color} strokeWidth={1} />
            <Path d="M4 6 L20 6" stroke={color} strokeOpacity={0.25} strokeWidth={0.8} strokeDasharray="3,2" />
            <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
          </G>
        </Svg>
      ),
      sad: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.95}>
            {Array.from({ length: 3 }).map((_, i) => {
              const r = 4 + i * 3;
              const w = 0.6 + i * 0.2;
              const dash = i % 2 === 0 ? '3,2' : undefined;
              return (
                <Circle
                  key={i}
                  cx={12}
                  cy={12}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.85}
                  strokeWidth={w}
                  strokeDasharray={dash}
                />
              );
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * Math.PI) / 3;
              const cx = 12 + 5.2 * Math.cos(angle);
              const cy = 12 + 5.2 * Math.sin(angle);
              return (
                <Circle key={`f${i}`} cx={cx} cy={cy} r={4.8} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={0.6} />
              );
            })}
            <Polygon points="12,8 14,13 10,13" fill="none" stroke={color} strokeWidth={0.8} opacity={0.75} />
            <Polygon points="12,16 14,11 10,11" fill="none" stroke={color} strokeWidth={0.8} opacity={0.6} />
            <Circle cx={12} cy={12} r={1.1} fill={color} />
            {Array.from({ length: 4 }).map((_, i) => {
              const angle = (i * 90 + 45) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 7;
              const y1 = 12 + Math.sin(angle) * 7;
              const x2 = 12 + Math.cos(angle) * 9.5;
              const y2 = 12 + Math.sin(angle) * 9.5;
              return <Path key={`sad-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.25} strokeWidth={0.8} />;
            })}
          </G>
        </Svg>
      ),
      angry: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Polygon points="12,2 20,8 20,16 12,22 4,16 4,8" fill="none" stroke={color} strokeWidth={1.6} />
            <Polygon points="12,6 16,10 12,14 8,10" fill="none" stroke={color} strokeWidth={1.1} />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 6.5;
              const y1 = 12 + Math.sin(angle) * 6.5;
              const x2 = 12 + Math.cos(angle) * 10.5;
              const y2 = 12 + Math.sin(angle) * 10.5;
              return <Path key={`ang-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.35} strokeWidth={1} />;
            })}
          </G>
        </Svg>
      ),
      calm: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Circle cx={12} cy={12} r={10.8} fill="none" stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={7} fill="none" stroke={color} strokeWidth={1} />
            <Circle cx={12} cy={12} r={2.4} fill="none" stroke={color} strokeWidth={1} />
            <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 8.5;
              const y1 = 12 + Math.sin(angle) * 8.5;
              const x2 = 12 + Math.cos(angle) * 9.5;
              const y2 = 12 + Math.sin(angle) * 9.5;
              return <Path key={`calm-wave-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.2} strokeWidth={0.8} />;
            })}
          </G>
        </Svg>
      ),
      inspired: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.98}>
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30) * Math.PI / 180;
              const inner = 2.6;
              const isLong = i % 2 === 0;
              const outer = isLong ? 12.4 : 9.2;
              const x1 = 12 + Math.cos(angle) * inner;
              const y1 = 12 + Math.sin(angle) * inner;
              const x2 = 12 + Math.cos(angle) * outer;
              const y2 = 12 + Math.sin(angle) * outer;
              const w = isLong ? 1.3 : 0.9;
              return (
                <Path
                  key={`ray-${i}`}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={color}
                  strokeOpacity={isLong ? 0.95 : 0.7}
                  strokeWidth={w}
                />
              );
            })}
            <Circle cx={12} cy={12} r={3.6} fill="none" stroke={color} strokeOpacity={0.95} strokeWidth={1.5} />
            <Polygon
              points="12,9.6 12.8,11.2 14.4,12 12.8,12.8 12,14.4 11.2,12.8 9.6,12 11.2,11.2"
              fill="none"
              stroke={color}
              strokeOpacity={0.95}
              strokeWidth={1}
            />
            <Circle cx={12} cy={12} r={1} fill={color} />
            <Circle cx={12} cy={12} r={14} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const r = 13.4;
              const size = 1.6;
              const cx = 12 + Math.cos(angle) * r;
              const cy = 12 + Math.sin(angle) * r;
              return (
                <Polygon
                  key={`spark-${i}`}
                  points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
                  fill={color}
                  opacity={0.85}
                />
              );
            })}
          </G>
        </Svg>
      ),
      happy: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.95}>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 6.8;
              const y1 = 12 + Math.sin(angle) * 6.8;
              const x2 = 12 + Math.cos(angle) * 11.2;
              const y2 = 12 + Math.sin(angle) * 11.2;
              return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeWidth={1.1} />;
            })}
            <Circle cx={12} cy={12} r={4.5} fill="none" stroke={color} strokeWidth={1.5} />
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * Math.PI / 180;
              const r = 13;
              const size = 1.2;
              const cx = 12 + Math.cos(angle) * r;
              const cy = 12 + Math.sin(angle) * r;
              return (
                <Circle key={`happy-dot-${i}`} cx={cx} cy={cy} r={size / 2} fill={color} opacity={0.7} />
              );
            })}
          </G>
        </Svg>
      ),
      energized: (
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <G opacity={0.95}>
            <Polygon points="12,2 18,8 18,16 12,22 6,16 6,8" fill="none" stroke={color} strokeWidth={1.6} />
            <Polygon points="12,6 15,9 15,15 12,18 9,15 9,9" fill="none" stroke={color} strokeWidth={1.1} />
            <Circle cx={12} cy={12} r={2.2} fill={color} />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45) * Math.PI / 180;
              const x1 = 12 + Math.cos(angle) * 5.5;
              const y1 = 12 + Math.sin(angle) * 5.5;
              const x2 = 12 + Math.cos(angle) * 11.5;
              const y2 = 12 + Math.sin(angle) * 11.5;
              return <Path key={`en-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.4} strokeWidth={1.1} />;
            })}
          </G>
        </Svg>
      ),
    };
    
    return geometryIcons[emotion.id] || getEmotionIconById(emotion.id, color);
  }, [getEmotionIconById]);

  const filteredSessions = useMemo(() => {
    const availableSessions = sessions.filter((s) => s.id !== 'welcome-intro');
    if (targetEmotionId) {
      return availableSessions.filter((s) => s.targetEmotions.includes(targetEmotionId));
    }
    return selectedEmotion ? availableSessions.filter((s) => s.targetEmotions.includes(selectedEmotion.id)) : availableSessions;
  }, [selectedEmotion, targetEmotionId]);

  // Use useFocusEffect to handle navigation after the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Add a small delay to ensure the navigation system is ready
      const timer = setTimeout(() => {
        setIsInitialized(true);
        if (!hasSeenWelcome) {
          router.replace("/welcome" as any);
          return;
        }
        if (!hasCompletedOnboarding) {
          router.replace("/onboarding" as any);
          return;
        }

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100);

      return () => clearTimeout(timer);
    }, [hasSeenWelcome, hasCompletedOnboarding, fadeAnim, scaleAnim, router])
  );

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(iconSpin, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    const sessionAnimations = sessionIconAnims.map((anim, index) => {
      const rotateLoop = Animated.loop(
        Animated.timing(anim.rotate, {
          toValue: 1,
          duration: 8000 + (index * 500),
          useNativeDriver: true,
        })
      );

      const scaleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim.scale, {
            toValue: 1.12,
            duration: 1200 + (index * 100),
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 1200 + (index * 100),
            useNativeDriver: true,
          }),
        ])
      );

      rotateLoop.start();
      scaleLoop.start();

      return { rotateLoop, scaleLoop };
    });

    return () => {
      iconSpin.stopAnimation();
      iconPulse.stopAnimation();
      sessionAnimations.forEach((anims) => {
        anims.rotateLoop.stop();
        anims.scaleLoop.stop();
      });
    };
  }, [iconSpin, iconPulse, sessionIconAnims]);

  // Don't render anything until initialized
  if (!isInitialized) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container} testID="home.screen">
      <LinearGradient
        colors={[palette.bg0, palette.bg1, "#071A24"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          testID="home.scroll"
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            testID="home.header"
          >
            <View style={styles.heroBadgeRow}>
              <AnimatedPressable onPress={handleDailyCheckInPress} testID="daily-check-in" style={styles.heroBadgePressable}>
                <View style={styles.heroBadge}>
                  <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
                  <Text style={styles.heroBadgeText}>Daily check-in</Text>
                </View>
              </AnimatedPressable>
            </View>

            <View style={styles.heroTitleRow}>
              <View style={styles.crownChip}>
                <Crown size={18} color={palette.bg0} strokeWidth={2.2} fill={palette.gold} />
              </View>
              <Text style={styles.title}>How are you feeling?</Text>
            </View>
            <Text style={styles.subtitle}>Pick the emotion that’s most present. We’ll cue sessions that match.</Text>

            <View style={styles.headerActionsRow}>
              <AnimatedPressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push("/subscription" as any);
                }}
                testID="header-subscription-button"
                style={styles.headerAction}
              >
                <View style={styles.headerActionInner}>
                  <Crown size={18} color={palette.gold} strokeWidth={2.2} />
                  <Text style={styles.headerActionText}>Premium</Text>
                </View>
              </AnimatedPressable>

              <AnimatedPressable onPress={() => router.push("/profile" as any)} testID="header-profile-button" style={styles.headerAction}>
                <View style={styles.headerActionInner}>
                  <User size={18} color={palette.text} strokeWidth={2.2} />
                  <Text style={styles.headerActionText}>Profile</Text>
                </View>
              </AnimatedPressable>
            </View>
          </Animated.View>

          <View
            style={styles.emotionsSection}
            testID="home.emotions"
            onLayout={(event) => setEmotionsSectionY(event.nativeEvent.layout.y)}
          >
            <Text style={styles.sectionTitleSmall}>Right now…</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emotionsContainer}>
              {emotionalStates.map((emotion) => {
                const isSelected = selectedEmotion?.id === emotion.id;
                return (
                  <Animated.View
                    key={emotion.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [14, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <AnimatedPressable onPress={() => handleEmotionSelect(emotion)} testID={`emotion.${emotion.id}`}>
                      <View style={[styles.emotionCardWrap, isSelected && styles.emotionCardWrapSelected]}>
                        <LinearGradient
                          colors={
                            isSelected
                              ? (emotion.gradient as unknown as readonly [string, string, ...string[]])
                              : [palette.card, palette.card] as const
                          }
                          style={styles.emotionCard}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.emotionTopRow}>
                            <View style={styles.emotionIconPill}>
                              <Animated.View
                                style={{
                                  transform: [
                                    {
                                      rotate: iconSpin.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "360deg"],
                                      }),
                                    },
                                    {
                                      scale: iconPulse.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.96, 1.06],
                                      }),
                                    },
                                  ],
                                }}
                                testID={`emotion.icon.${emotion.id}`}
                              >
                                {getEmotionIconWithSmallerSize(
                                  emotion,
                                  isSelected ? palette.text : (emotion.gradient?.[0] ?? palette.text)
                                )}
                              </Animated.View>
                            </View>

                            <View style={[styles.selectionDot, isSelected && styles.selectionDotSelected]}>
                              {isSelected ? <Check size={14} color={palette.bg0} strokeWidth={3} /> : null}
                            </View>
                          </View>

                          <Text style={[styles.emotionLabel, isSelected && styles.emotionLabelSelected]}>{emotion.label}</Text>
                          <Text style={styles.emotionHint}>tap to filter</Text>
                        </LinearGradient>
                      </View>
                    </AnimatedPressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>
              {targetEmotionId
                ? `Move toward ${emotionalStates.find(e => e.id === targetEmotionId)?.label ?? ''}`
                : selectedEmotion
                ? `Sessions for ${selectedEmotion.label}`
                : "Recommended Sessions"}
            </Text>

            {filteredSessions.map((session, index) => (
              <Animated.View
                key={session.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={session.gradient as unknown as readonly [string, string, ...string[]]}
                    style={styles.sessionCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.sessionContent}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>{session.title}</Text>
                        <Text style={styles.sessionDescription}>
                          {session.description}
                        </Text>
                        <View style={styles.sessionMeta}>
                          <View style={styles.sessionTag}>
                            <Text style={styles.sessionTagText}>
                              {session.duration} min
                            </Text>
                          </View>
                          <View style={styles.sessionTag}>
                            <Text style={styles.sessionTagText}>
                              {session.frequency}Hz
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Animated.View
                        style={[
                          styles.sessionIcon,
                          {
                            transform: [
                              {
                                rotate: sessionIconAnims[index]?.rotate.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                }) || '0deg',
                              },
                              {
                                scale: sessionIconAnims[index]?.scale || 1,
                              },
                            ],
                          },
                        ]}
                      >
                        {getSessionIcon(session)}
                      </Animated.View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>



          <View style={styles.chatSection}>
            <TouchableOpacity
              testID="openAIChat"
              onPress={handleOpenAIChat}
              style={styles.chatCard}
              activeOpacity={0.85}
            >
              <View style={styles.chatIconContainer}>
                <Sparkles size={22} color={palette.gold} strokeWidth={2.5} />
              </View>
              <View style={styles.chatContent}>
                <Text style={styles.chatTitle}>Chat about your feelings</Text>
                <Text style={styles.chatSubtitle}>A gentle check-in, powered by AI</Text>
              </View>
              <MessageCircle size={20} color={palette.textFaint} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showAIChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIChatModal(false)}
      >
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
                  onPress={() => setShowAIChatModal(false)}
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
                      message.role === 'user' ? styles.chatMessageUser : styles.chatMessageAI,
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg0,
  },
  glowTopRight: {
    position: "absolute",
    top: -120,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 260,
    backgroundColor: "rgba(74,163,255,0.22)",
    transform: [{ rotate: "18deg" }],
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -180,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 320,
    backgroundColor: "rgba(31,214,193,0.16)",
    transform: [{ rotate: "-10deg" }],
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  heroBadgePressable: {
    borderRadius: 999,
  },
  heroBadge: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(248,196,108,0.10)",
    borderWidth: 1,
    borderColor: "rgba(248,196,108,0.22)",
  },
  heroBadgeText: {
    color: palette.gold,
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  heroBadgeMuted: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroBadgeMutedText: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  heroTitleRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  crownChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(248,196,108,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: palette.text,
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 10,
    color: palette.textDim,
    fontSize: 15,
    lineHeight: 22,
  },
  headerActionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  headerAction: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.stroke,
    overflow: "hidden",
  },
  headerActionInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
  },
  headerActionText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800" as const,
    letterSpacing: 0.2,
  },
  emotionsSection: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sectionTitleSmall: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  emotionsContainer: {
    paddingRight: 18,
    paddingBottom: 14,
    paddingLeft: 18,
  },
  emotionCardWrap: {
    width: 150,
    marginRight: 12,
  },
  emotionCardWrapSelected: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  emotionCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.stroke,
    minHeight: 112,
  },
  emotionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emotionIconPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionDot: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionDotSelected: {
    backgroundColor: palette.teal,
    borderColor: "rgba(31,214,193,0.8)",
  },
  emotionLabel: {
    marginTop: 10,
    color: palette.text,
    fontSize: 16,
    fontWeight: "900" as const,
    letterSpacing: -0.2,
  },
  emotionLabelSelected: {
    color: palette.text,
  },
  emotionHint: {
    marginTop: 2,
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  sessionsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 20,
  },
  sessionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    minHeight: 120,
  },
  sessionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
    marginRight: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
    lineHeight: 20,
  },
  sessionMeta: {
    flexDirection: "row",
    gap: 8,
  },
  sessionTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  sessionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600" as const,
  },
  vibroacousticStatus: {
    marginTop: 20,
    backgroundColor: "rgba(0,255,150,0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,150,0.3)",
  },
  vibroacousticIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00ff96",
    marginRight: 8,
  },
  vibroacousticText: {
    color: "#00ff96",
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },

  chatSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 30,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(147,51,234,0.08)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.2)",
    gap: 12,
  },
  chatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(147,51,234,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  chatSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },

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