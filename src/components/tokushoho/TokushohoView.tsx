import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Mail, ExternalLink, Info, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TokushohoView: React.FC = () => {
  const { setActiveTab } = useApp();

  useEffect(() => {
    const originalTitle = document.title;
    document.title = '特定商取引法に基づく表記 | SunnyLearn';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      document.title = originalTitle || 'SunnyLearn - Япон хэл сурах';
    };
  }, []);

  const handleBack = () => {
    setActiveTab('home');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top navigation back button */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ホームに戻る (Нүүр хуудас руу буцах)</span>
        </button>
      </div>

      {/* Header section */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 text-xs font-bold border border-orange-200 dark:border-orange-800">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          <span>Legal Disclosure / 特定商取引法</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
          特定商取引法に基づく表記
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          日本国の「特定商取引に関する法律」（特定商取引法）第11条に基づき、サービスの提供条件および事業者情報を以下の通り明記いたします。
        </p>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-stone-200 dark:divide-stone-800">
          {/* 販売事業者 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              販売事業者
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
              請求があり次第、遅滞なく開示いたします。
            </dd>
          </div>

          {/* サービス名 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              サービス名
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              SunnyLearn
            </dd>
          </div>

          {/* 運営責任者 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              運営責任者
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
              請求があり次第、遅滞なく開示いたします。
            </dd>
          </div>

          {/* 所在地 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              所在地
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
              請求があり次第、遅滞なく開示いたします。
            </dd>
          </div>

          {/* 電話番号 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              電話番号
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
              請求があり次第、遅滞なく開示いたします。
            </dd>
          </div>

          {/* お問い合わせ先 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              お問い合わせ先
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500 shrink-0" />
              <a
                href="mailto:sunnylearn.contact@gmail.com"
                className="hover:text-[#EF233C] dark:hover:text-red-400 underline decoration-stone-300 dark:decoration-stone-700 underline-offset-4"
              >
                sunnylearn.contact@gmail.com
              </a>
            </dd>
          </div>

          {/* 販売URL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              販売URL
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm font-mono text-stone-800 dark:text-stone-200">
              <a
                href="https://sunnylearn.online/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#EF233C] dark:hover:text-red-400 inline-flex items-center gap-1"
              >
                <span>https://sunnylearn.online/</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>
            </dd>
          </div>

          {/* 販売価格 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              販売価格
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-base sm:text-lg font-black text-[#EF233C] dark:text-red-400">
                  SunnyLearn Premium: 880円（税込）
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">/ 30日間</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                ※消費税込みの総額表示となっております。
              </p>
            </dd>
          </div>

          {/* 商品代金以外に必要な料金 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              商品代金以外に必要な料金
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              インターネット接続に必要な通信料金等は利用者の負担となります。
            </dd>
          </div>

          {/* 支払方法 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              支払方法
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/40 text-xs">
                PayPay
              </span>
            </dd>
          </div>

          {/* 支払時期 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              支払時期
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              PayPay決済時にお支払いが確定します。
            </dd>
          </div>

          {/* サービス提供時期 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              サービス提供時期
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              決済完了後、Premium機能を利用できる状態になった時点から提供を開始します。
            </dd>
          </div>

          {/* Premium利用期間 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              Premium利用期間
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
              30日間
            </dd>
          </div>

          {/* 自動更新 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              自動更新
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>自動更新なし</span>
            </dd>
          </div>

          {/* 解約について */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              解約について
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              自動更新ではないため、利用期間終了後に自動的な追加請求は行われません。利用期間満了とともにPremium機能は自動的に終了します。
            </dd>
          </div>

          {/* 返品・キャンセル・返金 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              返品・キャンセル・返金
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-2">
              <p>
                本サービスはデジタルコンテンツおよびオンラインサービスの性質上、購入・決済手続き完了後のお客様のご都合によるキャンセル・返品・返金はお受けできません。
              </p>
              <p>
                なお、法令に別段の定めがある場合、または当サービスの利用規約・個別規定に特別な定めがある場合はこれに従います。ご購入前にサービス内容および動作環境を十分にご確認の上、お申し込みください。
              </p>
            </dd>
          </div>

          {/* 動作環境 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-5 sm:p-6 gap-2 sm:gap-4 bg-stone-50/50 dark:bg-stone-900/50">
            <dt className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-200">
              動作環境
            </dt>
            <dd className="sm:col-span-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-2">
              <p>
                SunnyLearnはWebブラウザ上で動作するオンラインWebサービスです。以下の環境でのご利用を推奨いたします。
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-stone-600 dark:text-stone-400 pl-1">
                <li>
                  <strong className="text-stone-800 dark:text-stone-200">推奨ブラウザ：</strong> Google Chrome 最新版、Apple Safari 最新版、Mozilla Firefox 最新版、Microsoft Edge 最新版
                </li>
                <li>
                  <strong className="text-stone-800 dark:text-stone-200">通信環境：</strong> 安定したインターネット接続環境が必要です。
                </li>
              </ul>
            </dd>
          </div>
        </div>
      </div>

      {/* Supplementary notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-start gap-3 text-xs sm:text-sm text-stone-800 dark:text-stone-200">
        <Info className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          販売事業者の氏名、所在地および電話番号については、特定商取引法第11条ただし書に基づき、請求があり次第、遅滞なく開示いたします。開示をご希望の場合は、上記メールアドレスまでお問い合わせください。
        </p>
      </div>
    </div>
  );
};

export default TokushohoView;
