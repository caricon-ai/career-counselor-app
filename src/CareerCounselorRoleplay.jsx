import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Play, RotateCcw, Volume2 } from 'lucide-react';

const CareerCounselorRoleplay = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const scenarios = [
    {
      id: 1,
      title: "転職を考える20代後半の会社員",
      description: "現職に不満があり、キャリアチェンジを検討中",
      persona: "27歳、営業職3年目、人間関係と将来性に悩んでいる"
    },
    {
      id: 2,
      title: "育児と仕事の両立に悩む30代女性",
      description: "復職後のキャリアと家庭の両立について相談",
      persona: "34歳、育休明け、時短勤務で今後のキャリアに不安"
    },
    {
      id: 3,
      title: "定年後の再就職を考える50代男性",
      description: "定年を見据えたセカンドキャリアの構築",
      persona: "56歳、製造業管理職、定年後の働き方を模索中"
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ja-JP';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const startSession = (scenario) => {
    setSelectedScenario(scenario);
    setSessionStarted(true);
    const greeting = getInitialGreeting(scenario);
    setMessages([{
      role: 'client',
      content: greeting,
      timestamp: new Date()
    }]);
  };

  const getInitialGreeting = (scenario) => {
    const greetings = {
      1: "こんにちは...。今日は相談に乗っていただきたくて来ました。実は、今の仕事を続けていいのか悩んでいて...",
      2: "はじめまして。育休から復帰して半年なんですが、仕事と育児の両立がうまくいかなくて...このままでいいのか不安なんです。",
      3: "よろしくお願いします。あと4年ほどで定年なんですが、その後どうしようかと考えていまして...まだ働きたいんですけどね。"
    };
    return greetings[scenario.id];
  };

  const generateClientResponse = async (counselorMessage, conversationHistory) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `あなたはキャリアコンサルタント試験のロールプレイで相談者役を演じています。

【相談者設定】
${selectedScenario.persona}
シナリオ: ${selectedScenario.description}

【会話履歴】
${conversationHistory.map(m => `${m.role === 'counselor' ? 'カウンセラー' : '相談者'}: ${m.content}`).join('\n')}

【カウンセラーの最新の発言】
${counselorMessage}

【指示】
- 相談者として自然に応答してください
- 感情や悩みをリアルに表現してください
- カウンセラーの質問に対して適切に答えつつ、徐々に本音や深い悩みを開示してください
- 短めの発言(1-3文程度)で返答してください
- 「」などの記号は使わず、自然な会話文だけを出力してください`
            }
          ]
        })
      });

      const data = await response.json();
      const clientResponse = data.content[0].text.trim();
      return clientResponse;
    } catch (error) {
      console.error('API Error:', error);
      return "すみません、少し考えさせてください...";
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateSession = async (conversationHistory) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `キャリアコンサルタント試験のロールプレイセッションを評価してください。

【会話履歴】
${conversationHistory.map(m => `${m.role === 'counselor' ? 'カウンセラー' : '相談者'}: ${m.content}`).join('\n')}

以下の観点で評価し、JSON形式で返してください：

{
  "listening": {
    "score": 0-100,
    "feedback": "傾聴姿勢についての具体的なフィードバック"
  },
  "questioning": {
    "score": 0-100,
    "feedback": "質問技法についての具体的なフィードバック"
  },
  "understanding": {
    "score": 0-100,
    "feedback": "問題把握についての具体的なフィードバック"
  },
  "rapport": {
    "score": 0-100,
    "feedback": "ラポール形成についての具体的なフィードバック"
  },
  "overall": {
    "score": 0-100,
    "feedback": "総合評価と改善アドバイス"
  }
}

評価基準:
- 傾聴姿勢: 相槌、共感、受容的態度
- 質問技法: 開かれた質問、掘り下げ、具体化
- 問題把握: 本質的な悩みの理解、整理
- ラポール形成: 信頼関係の構築

JSONのみを出力してください。`
            }
          ]
        })
      });

      const data = await response.json();
      const evalText = data.content[0].text.trim();
      const jsonMatch = evalText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const evalData = JSON.parse(jsonMatch[0]);
        return evalData;
      }
      throw new Error('評価データの解析に失敗しました');
    } catch (error) {
      console.error('Evaluation Error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const counselorMessage = {
      role: 'counselor',
      content: input.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, counselorMessage];
    setMessages(updatedMessages);
    setInput('');

    const clientResponse = await generateClientResponse(input.trim(), updatedMessages);
    
    const clientMessage = {
      role: 'client',
      content: clientResponse,
      timestamp: new Date()
    };

    setMessages([...updatedMessages, clientMessage]);
  };

  const endSession = async () => {
    setSessionEnded(true);
    const evalResult = await evaluateSession(messages);
    setEvaluation(evalResult);
  };

  const resetSession = () => {
    setMessages([]);
    setInput('');
    setSessionStarted(false);
    setSessionEnded(false);
    setEvaluation(null);
    setSelectedScenario(null);
    stopSpeaking();
  };

  const ScoreCircle = ({ score, label }) => {
    const getColor = (score) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="flex flex-col items-center">
        <div className={`text-4xl font-bold ${getColor(score)}`}>
          {score}
        </div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
      </div>
    );
  };

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              キャリアコンサルタント試験
            </h1>
            <h2 className="text-2xl text-gray-600">ロールプレイAI</h2>
            <p className="mt-4 text-gray-600">
              実践的なロールプレイで面接技法を磨きましょう
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => startSession(scenario)}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {scenario.title}
                </h3>
                <p className="text-gray-600 mb-4">{scenario.description}</p>
                <div className="bg-blue-50 rounded p-3 text-sm text-gray-700">
                  <strong>設定:</strong> {scenario.persona}
                </div>
                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  このシナリオを開始
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">使い方</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• シナリオを選択してセッションを開始します</li>
              <li>• テキスト入力または音声入力で相談者と対話できます</li>
              <li>• 相談者の発言を音声で聞くこともできます</li>
              <li>• 適切なタイミングで「セッション終了」を押して評価を受けます</li>
              <li>• 傾聴姿勢、質問技法、問題把握、ラポール形成の4つの観点で評価されます</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (sessionEnded && evaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              セッション評価
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <ScoreCircle score={evaluation.listening.score} label="傾聴姿勢" />
              <ScoreCircle score={evaluation.questioning.score} label="質問技法" />
              <ScoreCircle score={evaluation.understanding.score} label="問題把握" />
              <ScoreCircle score={evaluation.rapport.score} label="ラポール形成" />
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                総合評価: {evaluation.overall.score}点
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {evaluation.overall.feedback}
              </p>
            </div>

            <div className="space-y-4">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-bold text-gray-800">傾聴姿勢</h4>
                <p className="text-gray-700">{evaluation.listening.feedback}</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-bold text-gray-800">質問技法</h4>
                <p className="text-gray-700">{evaluation.questioning.feedback}</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-bold text-gray-800">問題把握</h4>
                <p className="text-gray-700">{evaluation.understanding.feedback}</p>
              </div>
              <div className="border-l-4 border-pink-500 pl-4">
                <h4 className="font-bold text-gray-800">ラポール形成</h4>
                <p className="text-gray-700">{evaluation.rapport.feedback}</p>
              </div>
            </div>

            <button
              onClick={resetSession}
              className="mt-8 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              新しいセッションを開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg flex flex-col h-[90vh]">
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-bold">{selectedScenario.title}</h2>
          <p className="text-sm opacity-90">{selectedScenario.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'counselor' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[80%]">
                {msg.role === 'client' && (
                  <button
                    onClick={() => speak(msg.content)}
                    className="mt-1 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors flex-shrink-0"
                    title="音声で聞く"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
                <div
                  className={`p-3 rounded-lg ${
                    msg.role === 'counselor'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {msg.role === 'counselor' ? 'あなた' : '相談者'}
                  </div>
                  <div>{msg.content}</div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2 mb-3">
            <button
              onClick={endSession}
              disabled={messages.length < 6 || isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              セッション終了
            </button>
            <button
              onClick={resetSession}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              リセット
            </button>
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                音声停止
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="メッセージを入力..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={isLoading}
            />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              disabled={isLoading}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={24} />
            </button>
          </div>
          {messages.length < 6 && (
            <p className="text-xs text-gray-500 mt-2">
              ※ 評価を受けるには最低3往復の対話が必要です
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerCounselorRoleplay;