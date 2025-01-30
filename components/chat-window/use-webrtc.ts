"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Conversation } from "./types";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface Message {
  type: string;
  text?: string;
  role?: string;
  content?: string;
  session?: {
    modalities: string[];
    tools: Tool[];
    input_audio_transcription: {
      model: string;
    };
  };
}

interface UseWebRTCAudioSessionReturn {
  status: string;
  isSessionActive: boolean;
  handleStartStopClick: () => void;
  registerFunction: (name: string, fn: (...args: unknown[]) => unknown) => void;
  conversation: Conversation[];
  sendTextMessage: (text: string) => void;
}

export default function useWebRTCAudioSession(
  voice: string,
  tools?: Tool[],
): UseWebRTCAudioSessionReturn {
  const [status, setStatus] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conversation, setConversation] = useState<Conversation[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const functionRegistry = useRef<Record<string, (...args: unknown[]) => unknown>>({});
  const ephemeralUserMessageIdRef = useRef<string | null>(null);

  const registerFunction = useCallback((name: string, fn: (...args: unknown[]) => unknown) => {
    functionRegistry.current[name] = fn;
  }, []);

  function configureDataChannel(dataChannel: RTCDataChannel) {
    const sessionUpdate: Message = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        tools: tools || [],
        input_audio_transcription: {
          model: "whisper-1",
        },
      },
    };
    dataChannel.send(JSON.stringify(sessionUpdate));
  }

  function getOrCreateEphemeralUserId(): string {
    let ephemeralId = ephemeralUserMessageIdRef.current;
    if (!ephemeralId) {
      ephemeralId = uuidv4();
      ephemeralUserMessageIdRef.current = ephemeralId;

      const newMessage: Conversation = {
        id: ephemeralId,
        role: "user",
        text: "",
        timestamp: new Date().toISOString(),
        isFinal: false,
        status: "speaking",
      };

      setConversation((prev) => [...prev, newMessage]);
    }
    return ephemeralId;
  }

  function updateEphemeralUserMessage(partial: Partial<Conversation>) {
    const ephemeralId = ephemeralUserMessageIdRef.current;
    if (!ephemeralId) return;

    setConversation((prev) =>
      prev.map((msg) => {
        if (msg.id === ephemeralId) {
          return { ...msg, ...partial };
        }
        return msg;
      }),
    );
  }

  function clearEphemeralUserMessage() {
    ephemeralUserMessageIdRef.current = null;
  }

  async function handleDataChannelMessage(event: MessageEvent) {
    try {
      const msg: Message = JSON.parse(event.data);

      switch (msg.type) {
        case "input_audio_buffer.speech_started": {
          getOrCreateEphemeralUserId();
          updateEphemeralUserMessage({ status: "speaking" });
          break;
        }

        case "input_audio_buffer.speech_stopped": {
          updateEphemeralUserMessage({ status: "speaking" });
          break;
        }

        case "input_audio_buffer.committed": {
          updateEphemeralUserMessage({
            text: "Processing speech...",
            status: "processing",
          });
          break;
        }

        case "transcript": {
          if (msg.text) {
            updateEphemeralUserMessage({
              text: msg.text,
              status: "complete",
              isFinal: true,
            });
            clearEphemeralUserMessage();
          }
          break;
        }

        case "message": {
          if (msg.role === "assistant") {
            setConversation((prev) => [
              ...prev,
              {
                id: uuidv4(),
                role: "assistant",
                text: msg.content,
                timestamp: new Date().toISOString(),
                isFinal: true,
                status: "complete",
              },
            ]);
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error handling data channel message:", error);
    }
  }

  async function getEphemeralToken() {
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to get ephemeral token: ${response.status}`);
      }
      const data = await response.json();
      return data.client_secret.value;
    } catch (err) {
      console.error("getEphemeralToken error:", err);
      throw err;
    }
  }

  async function startSession() {
    try {
      // 既存のセッションをクリーンアップ
      if (peerConnectionRef.current || audioStreamRef.current) {
        stopSession();
        // 少し待ってから新しいセッションを開始
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setStatus("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      audioContextRef.current = audioContext;

      setStatus("Fetching ephemeral token...");
      const ephemeralToken = await getEphemeralToken();

      setStatus("Establishing connection...");
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      const dataChannel = pc.createDataChannel("response");
      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        configureDataChannel(dataChannel);
      };
      dataChannel.onmessage = handleDataChannelMessage;

      pc.addTrack(stream.getTracks()[0]);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const response = await fetch(`${baseUrl}?model=${model}&voice=${voice}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralToken}`,
          "Content-Type": "application/sdp",
        },
      });

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setIsSessionActive(true);
      setStatus("Session established successfully!");
    } catch (err) {
      console.error("startSession error:", err);
      setStatus(`Error: ${err}`);
      stopSession();
    }
  }

  function stopSession() {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    ephemeralUserMessageIdRef.current = null;
    setIsSessionActive(false);
    setStatus("Session stopped");
    setConversation([]);
  }

  function handleStartStopClick() {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  }

  function sendTextMessage(text: string) {
    if (!dataChannelRef.current) return;

    const message: Message = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text,
          },
        ],
      },
    };

    setConversation((prev) => [
      ...prev,
      {
        id: uuidv4(),
        role: "user",
        text,
        timestamp: new Date().toISOString(),
        isFinal: true,
        status: "complete",
      },
    ]);

    dataChannelRef.current.send(JSON.stringify(message));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Register all functions by iterating over the object
    const toolsRef = tools || {};
    Object.entries(toolsRef).forEach(([name, func]) => {
      const functionNames: Record<string, string> = {
        timeFunction: 'getCurrentTime',
        backgroundFunction: 'changeBackgroundColor',
        weatherFunction: 'getWeather',
        calculatorFunction: 'calculate'
      };
      
      registerFunction(functionNames[name], func as (...args: unknown[]) => unknown);
    });
  }, [registerFunction]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return {
    status,
    isSessionActive,
    handleStartStopClick,
    registerFunction,
    conversation,
    sendTextMessage,
  };
}
