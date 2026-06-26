import { useEffect } from 'react';
import { Sparkles, Brain, Lightbulb, Flame, RefreshCw, AlertTriangle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import SkeletonCard from '../../components/ui/SkeletonCard';

export default function InsightsPage() {
  const { data, loading, error, execute } = useApi(api.insights.getInsights);

  useEffect(() => {
    execute();
  }, [execute]);

  if (error) {
    return (
      <div className="card p-12 text-center max-w-2xl mx-auto mt-12">
        <AlertTriangle className="h-16 w-16 mx-auto text-rose-500 mb-6" />
        <h2 className="text-2xl font-semibold text-white mb-4">Insights Unavailable</h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <button onClick={() => execute()} className="btn-primary mx-auto">
          <RefreshCw size={18} className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="text-amber-400 h-8 w-8" />
            AI Insights
          </h1>
          <p className="text-slate-400 mt-2">Personalized financial analysis powered by Groq AI.</p>
        </div>
        {loading && (
          <div className="text-slate-500 flex items-center text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" />
            Analyzing your finances...
          </div>
        )}
      </div>

      {loading || !data ? (
        <div className="space-y-6">
          <SkeletonCard className="h-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard className="h-40" />
            <SkeletonCard className="h-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Executive Summary */}
          <div className="card p-8 bg-gradient-to-br from-charcoal-800 to-charcoal-900 border border-amber-500/20 shadow-glow-amber relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Brain size={120} />
            </div>
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
                <Sparkles size={16} className="mr-2" /> Monthly Executive Summary
              </h2>
              <p className="text-xl leading-relaxed text-slate-200">
                {data.monthlySummary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Anomalies */}
            <div>
              <h3 className="section-title mb-4 flex items-center">
                <AlertTriangle size={20} className="text-rose-400 mr-2" />
                Spending Anomalies
              </h3>
              <div className="space-y-4">
                {data.anomalies.length > 0 ? (
                  data.anomalies.map((anomaly, i) => (
                    <div key={i} className="card p-5 border-rose-500/20 bg-rose-500/5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-semibold text-white">{anomaly.category}</span>
                        <span className="badge-rose">+{anomaly.percentageChange}%</span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{anomaly.message}</p>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block mb-1">Current</span>
                          <span className="text-rose-400 font-medium num">{formatCurrency(anomaly.currentAmount)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-1">Average</span>
                          <span className="text-slate-300 font-medium num">{formatCurrency(anomaly.averageAmount)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card p-6 text-center bg-charcoal-800 border-dashed border-charcoal-600">
                    <p className="text-slate-400">No significant spending anomalies detected this month. Great job keeping your expenses predictable!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <h3 className="section-title mb-4 flex items-center">
                <Lightbulb size={20} className="text-amber-400 mr-2" />
                Optimization Suggestions
              </h3>
              <div className="space-y-4">
                {data.suggestions.length > 0 ? (
                  data.suggestions.map((suggestion, i) => (
                    <div key={i} className="card p-5 border-charcoal-600 hover:border-amber-500/30 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">{suggestion.title}</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">{suggestion.description}</p>
                        </div>
                        {suggestion.potentialSavings && (
                          <div className="ml-4 text-center shrink-0">
                            <span className="block text-[10px] uppercase text-emerald-500 font-bold mb-1">Save Up To</span>
                            <span className="text-xl font-bold text-emerald-400 num">{formatCurrency(suggestion.potentialSavings)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card p-6 text-center">
                    <p className="text-slate-400">No suggestions right now.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Streaks */}
          <div>
            <h3 className="section-title mb-4 flex items-center">
              <Flame size={20} className="text-orange-500 mr-2" />
              Financial Streaks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.streaks.length > 0 ? (
                data.streaks.map((streak, i) => (
                  <div key={i} className="card p-6 flex flex-col items-center text-center group hover:border-orange-500/50 hover:shadow-glow transition-all">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                      {streak.icon}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-white text-lg">{streak.type}</h4>
                      <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-xs font-bold border border-orange-500/20">
                        {streak.count}x
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{streak.description}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full card p-8 text-center border-dashed">
                  <p className="text-slate-400">Keep sticking to your budgets to build up streaks!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
