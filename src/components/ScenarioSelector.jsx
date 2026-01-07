import { useState } from 'react';
import { Play, Clock, Users, TrendingUp, Target, ArrowLeft, Sparkles } from 'lucide-react';

export default function ScenarioSelector({ scenarios, onSelectScenario, onBack }) {
  const [difficulty, setDifficulty] = useState('all');
  
  const filteredScenarios = difficulty === 'all' 
    ? scenarios 
    : scenarios.filter(s => s.difficulty === difficulty);
  
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 border-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    advanced: 'bg-red-100 text-red-800 border-red-200',
  };
  
  const difficultyLabels = {
    beginner: '初級',
    intermediate: '中級',
    advanced: '上級',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                🎯 CareerAI
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>15分 / セッション</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* タイトルセクション */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-blue-600 text-sm font-semibold">AIロールプレイ練習</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            シナリオを選択してください
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            難易度別に用意されたシナリオから選んで、本番さながらの練習を始めましょう
          </p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard icon={Users} label="利用者数" value="10,000+" color="blue" />
          <StatCard icon={TrendingUp} label="満足度" value="92%" color="green" />
          <StatCard icon={Target} label="合格率向上" value="+35%" color="purple" />
          <StatCard icon={Clock} label="平均練習時間" value="15分" color="orange" />
        </div>

        {/* 難易度フィルター */}
        <div className="flex justify-center gap-3 mb-8">
          {[
            { value: 'all', label: 'すべて' },
            { value: 'beginner', label: '初級' },
            { value: 'intermediate', label: '中級' },
            { value: 'advanced', label: '上級' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDifficulty(filter.value)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                difficulty === filter.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* シナリオカード */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300 hover:transform hover:scale-105"
            >
              <div className="p-6">
                {/* 難易度バッジ */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColors[scenario.difficulty]}`}>
                    {difficultyLabels[scenario.difficulty]}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>15分</span>
                  </div>
                </div>

                {/* タイトル */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                  {scenario.title}
                </h3>

                {/* 説明 */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {scenario.description}
                </p>

                {/* 特徴 */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span>年齢: {scenario.persona.age}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    <span>職業: {scenario.persona.occupation}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                    <span>性格: {scenario.persona.personality}</span>
                  </div>
                </div>

                {/* 開始ボタン */}
                <button
                  onClick={() => onSelectScenario(scenario)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center group-hover:from-blue-700 group-hover:to-purple-700"
                >
                  <Play className="w-5 h-5 mr-2" />
                  このシナリオを開始
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ヒントセクション */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              高得点を取るためのポイント
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <TipCard
                title="傾聴姿勢"
                tips={['適切な相槌を打つ', '相手の感情を受け止める', 'ペースを尊重する']}
              />
              <TipCard
                title="質問技法"
                tips={['開かれた質問を70%以上', '感情を掘り下げる', '具体化を促す']}
              />
              <TipCard
                title="問題把握"
                tips={['話を整理・要約する', '本質的な悩みを見極める', '相談者の強みを把握']}
              />
              <TipCard
                title="ラポール形成"
                tips={['安心感を与える', '相談者を尊重する', '共感を示す']}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 統計カード
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition">
      <div className={`w-10 h-10 bg-gradient-to-br ${colors[color]} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

// ヒントカード
function TipCard({ title, tips }) {
  return (
    <div className="bg-white rounded-xl p-4">
      <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start text-sm text-gray-600">
            <span className="text-green-500 mr-2">✓</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}