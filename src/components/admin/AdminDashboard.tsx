import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Search,
  BookA,
  Sparkles,
  BookOpen,
  MessageSquareQuote,
  Layers,
  FileText,
  Headphones,
  CheckSquare,
  Mail,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JLPTLevel, VocabularyItem, KanjiItem, GrammarItem, ExampleSentenceItem, LessonItem, ReadingItem, ListeningItem, QuizSet, FeedbackItem } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { SunnyLogo } from '../common/SunnyLogo';
import { apiService } from '../../services/api';
import { AdminPaymentsTab } from './AdminPaymentsTab';

type AdminTab =
  | 'overview'
  | 'payments'
  | 'vocab'
  | 'kanji'
  | 'grammar'
  | 'sentences'
  | 'lessons'
  | 'reading'
  | 'listening'
  | 'quizzes'
  | 'feedback';

export const AdminDashboard: React.FC = () => {
  const {
    adminLogout,
    data,
    feedbackList,
    adminPaymentStats,
    showToast,
    refreshData,
    addVocab,
    updateVocab,
    deleteVocab,
    addKanji,
    updateKanji,
    deleteKanji,
    addGrammar,
    updateGrammar,
    deleteGrammar,
    addSentence,
    updateSentence,
    deleteSentence,
    addLesson,
    updateLesson,
    deleteLesson,
    addReading,
    updateReading,
    deleteReading,
    addListening,
    updateListening,
    deleteListening,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    deleteFeedback,
    updateFeedbackStatus
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<JLPTLevel | 'all'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<AdminTab>('vocab');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  const openAddModal = (type: AdminTab) => {
    setModalType(type);
    setEditingItem(null);
    if (type === 'vocab') {
      setFormData({
        japanese: '',
        reading: '',
        romaji: '',
        mongolian: '',
        explanation: '',
        partOfSpeech: 'Нэр үг',
        jlptLevel: 'N5',
        category: 'Ерөнхий',
        exampleSentence: '',
        exampleReading: '',
        exampleMongolian: ''
      });
    } else if (type === 'kanji') {
      setFormData({
        kanji: '',
        onyomi: '',
        kunyomi: '',
        mongolian: '',
        jlptLevel: 'N5',
        exampleWords: [{ word: '', reading: '', mongolian: '' }],
        exampleSentence: '',
        exampleReading: '',
        exampleMongolian: ''
      });
    } else if (type === 'grammar') {
      setFormData({
        pattern: '',
        mongolian: '',
        explanation: '',
        usage: '',
        structure: '',
        jlptLevel: 'N5',
        examples: [{ japanese: '', reading: '', mongolian: '' }],
        similarGrammar: '',
        differences: '',
        commonMistakes: ''
      });
    } else if (type === 'sentences') {
      setFormData({
        japanese: '',
        reading: '',
        mongolian: '',
        jlptLevel: 'N5',
        category: 'Ерөнхий',
        notes: ''
      });
    } else if (type === 'lessons') {
      setFormData({
        title: '',
        description: '',
        jlptLevel: 'N5',
        order: 1,
        category: 'Суурь',
        content: ''
      });
    } else if (type === 'reading') {
      setFormData({
        title: '',
        jlptLevel: 'N5',
        japaneseText: '',
        furiganaText: '',
        mongolianTranslation: '',
        vocabularyNotes: [{ word: '', reading: '', mongolian: '' }],
        questions: [{ id: 'q1', question: '', options: ['', '', '', ''], answer: 0, explanation: '' }]
      });
    } else if (type === 'listening') {
      setFormData({
        title: '',
        jlptLevel: 'N5',
        dialogue: [{ speaker: 'A', japanese: '', reading: '', mongolian: '' }],
        questions: [{ id: 'q1', question: '', options: ['', '', '', ''], answer: 0, explanation: '' }]
      });
    } else if (type === 'quizzes') {
      setFormData({
        title: '',
        jlptLevel: 'N5',
        questions: [{ id: 'q1', question: '', questionReading: '', options: ['', '', '', ''], answer: 0, explanation: '' }]
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (type: AdminTab, item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData(JSON.parse(JSON.stringify(item)));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'vocab') {
        if (editingItem) {
          await updateVocab({ ...formData, id: editingItem.id });
          showToast('Үгийг амжилттай заслаа.', 'success');
        } else {
          await addVocab(formData);
          showToast('Шинэ үг амжилттай нэмэгдлээ.', 'success');
        }
      } else if (modalType === 'kanji') {
        if (editingItem) {
          await updateKanji({ ...formData, id: editingItem.id });
          showToast('Ханзыг амжилттай заслаа.', 'success');
        } else {
          await addKanji(formData);
          showToast('Шинэ ханз амжилттай нэмэгдлээ.', 'success');
        }
      } else if (modalType === 'grammar') {
        if (editingItem) {
          await updateGrammar({ ...formData, id: editingItem.id });
          showToast('Дүрмийг амжилттай заслаа.', 'success');
        } else {
          await addGrammar(formData);
          showToast('Шинэ дүрэм амжилттай нэмэгдлээ.', 'success');
        }
      } else if (modalType === 'sentences') {
        if (editingItem) {
          await updateSentence({ ...formData, id: editingItem.id });
          showToast('Жишээг амжилттай заслаа.', 'success');
        } else {
          await addSentence(formData);
          showToast('Шинэ жишээ өгүүлбэр амжилттай нэмэгдлээ.', 'success');
        }
      } else if (modalType === 'lessons') {
        if (editingItem) {
          await updateLesson({ ...formData, id: editingItem.id });
          showToast('Хичээлийг амжилттай заслаа.', 'success');
        } else {
          await addLesson(formData);
          showToast('Шинэ хичээл амжилттай нэмэгдлээ.', 'success');
        }
      } else if (modalType === 'reading') {
        if (editingItem) {
          await updateReading({ ...formData, id: editingItem.id });
          showToast('Унших дасгалыг амжилттай заслаа.', 'success');
        } else {
          await addReading(formData);
          showToast('Шинэ унших дасгал амжилттай нэмэгдлээ.', 'success');
        }
      } else if (modalType === 'listening') {
        if (editingItem) {
          await updateListening({ ...formData, id: editingItem.id });
          showToast('Сонсох дасгалыг амжилттай заслаа.', 'success');
        } else {
          await addListening(formData);
          showToast('Шинэ сонсох дасгал амжилттай нэмэгдлээ.', 'success');
        }
      } else if (modalType === 'quizzes') {
        if (editingItem) {
          await updateQuiz({ ...formData, id: editingItem.id });
          showToast('Сорил тестийг амжилттай заслаа.', 'success');
        } else {
          await addQuiz(formData);
          showToast('Шинэ сорил тест амжилттай нэмэгдлээ.', 'success');
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Хадгалахад алдаа гарлаа.', 'error');
    }
  };

  const handleDelete = async (type: AdminTab, id: string) => {
    if (!window.confirm('Та энэ бүртгэлийг устгахдаа итгэлтэй байна уу?')) return;
    try {
      if (type === 'vocab') await deleteVocab(id);
      if (type === 'kanji') await deleteKanji(id);
      if (type === 'grammar') await deleteGrammar(id);
      if (type === 'sentences') await deleteSentence(id);
      if (type === 'lessons') await deleteLesson(id);
      if (type === 'reading') await deleteReading(id);
      if (type === 'listening') await deleteListening(id);
      if (type === 'quizzes') await deleteQuiz(id);
      if (type === 'feedback') await deleteFeedback(id);
      showToast('Амжилттай устгагдлаа.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Устгахад алдаа гарлаа.', 'error');
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'overview', label: 'Хяналтын самбар', icon: ShieldCheck, count: 0 },
    {
      id: 'payments',
      label: (adminPaymentStats?.pendingCount || 0) > 0
        ? `🔔 Шалгах төлбөр (${adminPaymentStats.pendingCount})`
        : 'Төлбөр (¥980)',
      icon: CreditCard,
      count: adminPaymentStats?.pendingCount || 0
    },
    { id: 'vocab', label: 'Үгийн сан', icon: BookA, count: (data.vocabulary || []).length },
    { id: 'kanji', label: 'Канжи', icon: Sparkles, count: (data.kanji || []).length },
    { id: 'grammar', label: 'Дүрэм', icon: BookOpen, count: (data.grammar || []).length },
    { id: 'sentences', label: 'Жишээ өгүүлбэр', icon: MessageSquareQuote, count: (data.exampleSentences || []).length },
    { id: 'lessons', label: 'Хичээлүүд', icon: Layers, count: (data.lessons || []).length },
    { id: 'reading', label: 'Унших дасгал', icon: FileText, count: (data.reading || []).length },
    { id: 'listening', label: 'Сонсох дасгал', icon: Headphones, count: (data.listening || []).length },
    { id: 'quizzes', label: 'Сорил шалгалт', icon: CheckSquare, count: (data.quizzes || []).length },
    { id: 'feedback', label: 'Санал хүсэлт', icon: Mail, count: (feedbackList || []).length }
  ];

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-transparent shrink-0 shadow-sm">
            <SunnyLogo className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base">
                Sunny<span className="text-red-600 dark:text-red-400">Learn</span> Админ самбар
              </span>
              <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider">
                Admin Area
              </span>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">sanaa0419z@gmail.com</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            title="Мэдээлэл шинэчлэх"
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={adminLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Гарах</span>
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <div className="bg-white dark:bg-stone-900 p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id !== 'overview' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-red-700 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Admin Content Container */}
        <main className="flex-1 bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm min-w-0">
          {/* Overview View */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  Сургалтын системийн тоон үзүүлэлт
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Серверийн мэдээллийн санд хадгалагдсан бүх сургалтын контент
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {navItems
                  .filter(n => n.id !== 'overview')
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 cursor-pointer hover:border-red-400 transition-all group"
                    >
                      <span className="text-xs text-stone-500 font-bold block">{item.label}</span>
                      <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">
                        {item.count}
                      </div>
                      <span className="text-[11px] text-red-600 dark:text-red-400 font-bold group-hover:underline mt-2 inline-block">
                        Удирдах →
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                    Хэрэглэгчдийн санал хүсэлтүүд
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Нийт {feedbackList.length} зурвас ирсэн байна
                  </p>
                </div>
              </div>

              {feedbackList.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs">
                  Одоогоор ирсэн санал хүсэлт алга байна.
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackList.map(item => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {item.name}
                          </span>
                          <span className="text-xs text-stone-400">({item.email})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-semibold">
                            {item.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.email && item.email.includes('@') && (
                            <a
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(item.email)}&su=${encodeURIComponent(`[Хариу - SunnyLearn] ${item.subject || 'Санал хүсэлтийн тухай'}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-750 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                              title="Gmail дээр хариу бичих"
                            >
                              <Mail className="w-3 h-3 text-red-500" />
                              <span>Хариулах</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          <button
                            onClick={() =>
                              updateFeedbackStatus(
                                item.id,
                                item.status === 'unread' ? 'reviewed' : 'unread'
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              item.status === 'reviewed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.status === 'reviewed' ? '✓ Шалгасан' : 'Шинэ'}
                          </button>
                          <button
                            onClick={() => handleDelete('feedback', item.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {item.subject}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-stone-400 block pt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && <AdminPaymentsTab />}

          {/* CRUD Tables for Vocab, Kanji, Grammar, Sentences, Lessons, Reading, Listening, Quizzes */}
          {activeTab !== 'overview' && activeTab !== 'feedback' && activeTab !== 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                    {navItems.find(n => n.id === activeTab)?.label} удирдах
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Шинээр нэмэх, засах, устгах боломжтой
                  </p>
                </div>

                <button
                  onClick={() => openAddModal(activeTab)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Шинээр нэмэх</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Хайх..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  />
                </div>

                <select
                  value={levelFilter}
                  onChange={e => setLevelFilter(e.target.value as any)}
                  className="px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
                >
                  <option value="all">Бүх Түвшин</option>
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>

              {/* Vocabulary Table */}
              {activeTab === 'vocab' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Түвшин</th>
                        <th className="py-3 px-2">Япон үг</th>
                        <th className="py-3 px-2">Уншлага</th>
                        <th className="py-3 px-2">Монгол утга</th>
                        <th className="py-3 px-2">Үгийн аймаг</th>
                        <th className="py-3 px-2 text-right">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                      {data.vocabulary
                        .filter(v => levelFilter === 'all' || v.jlptLevel === levelFilter)
                        .filter(
                          v =>
                            !search.trim() ||
                            v.japanese.includes(search) ||
                            v.reading.includes(search) ||
                            v.mongolian.includes(search)
                        )
                        .map(item => (
                          <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                            <td className="py-3 px-2">
                              <LevelBadge level={item.jlptLevel} size="sm" />
                            </td>
                            <td className="py-3 px-2 font-bold font-jp text-sm text-stone-900 dark:text-stone-100">
                              {item.japanese}
                            </td>
                            <td className="py-3 px-2 text-stone-500 font-jp">{item.reading}</td>
                            <td className="py-3 px-2 font-medium text-red-600 dark:text-red-400">
                              {item.mongolian}
                            </td>
                            <td className="py-3 px-2 text-stone-400">{item.partOfSpeech}</td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal('vocab', item)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete('vocab', item.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Kanji Table */}
              {activeTab === 'kanji' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Түвшин</th>
                        <th className="py-3 px-2">Ханз</th>
                        <th className="py-3 px-2">Онь / Күн</th>
                        <th className="py-3 px-2">Монгол утга</th>
                        <th className="py-3 px-2 text-right">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                      {data.kanji
                        .filter(k => levelFilter === 'all' || k.jlptLevel === levelFilter)
                        .filter(
                          k =>
                            !search.trim() ||
                            k.kanji.includes(search) ||
                            k.onyomi.includes(search) ||
                            k.mongolian.includes(search)
                        )
                        .map(item => (
                          <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                            <td className="py-3 px-2">
                              <LevelBadge level={item.jlptLevel} size="sm" />
                            </td>
                            <td className="py-3 px-2 font-bold font-jp text-xl text-stone-900 dark:text-stone-100">
                              {item.kanji}
                            </td>
                            <td className="py-3 px-2 text-stone-500">
                              <div>О: {item.onyomi}</div>
                              <div>К: {item.kunyomi}</div>
                            </td>
                            <td className="py-3 px-2 font-bold text-stone-900 dark:text-stone-100">
                              {item.mongolian}
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal('kanji', item)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete('kanji', item.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Grammar Table */}
              {activeTab === 'grammar' && (
                <div className="space-y-3">
                  {data.grammar
                    .filter(g => levelFilter === 'all' || g.jlptLevel === levelFilter)
                    .filter(
                      g =>
                        !search.trim() ||
                        g.pattern.includes(search) ||
                        g.mongolian.includes(search)
                    )
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <span className="font-bold text-base font-jp text-stone-900 dark:text-stone-100">
                              {item.pattern}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1">
                            {item.mongolian}
                          </p>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                            {item.explanation}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditModal('grammar', item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('grammar', item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Sentences Table */}
              {activeTab === 'sentences' && (
                <div className="space-y-3">
                  {data.exampleSentences
                    .filter(s => levelFilter === 'all' || s.jlptLevel === levelFilter)
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <span className="font-bold text-sm font-jp">{item.japanese}</span>
                          </div>
                          <p className="text-xs text-stone-500">{item.mongolian}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('sentences', item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('sentences', item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Lessons Table */}
              {activeTab === 'lessons' && (
                <div className="space-y-3">
                  {data.lessons
                    .filter(l => levelFilter === 'all' || l.jlptLevel === levelFilter)
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <span className="text-xs text-stone-400">{item.order}-р бүлэг</span>
                            <h4 className="font-bold text-sm">{item.title}</h4>
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-1">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('lessons', item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('lessons', item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Reading Table */}
              {activeTab === 'reading' && (
                <div className="space-y-3">
                  {data.reading
                    .filter(r => levelFilter === 'all' || r.jlptLevel === levelFilter)
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <h4 className="font-bold text-sm font-jp">{item.title}</h4>
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-1 mt-1">{item.japaneseText}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('reading', item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('reading', item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Listening Table */}
              {activeTab === 'listening' && (
                <div className="space-y-3">
                  {data.listening
                    .filter(l => levelFilter === 'all' || l.jlptLevel === levelFilter)
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <h4 className="font-bold text-sm font-jp">{item.title}</h4>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {item.dialogue.length} мөр харилцан яриа
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('listening', item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('listening', item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Quizzes Table */}
              {activeTab === 'quizzes' && (
                <div className="space-y-3">
                  {data.quizzes
                    .filter(q => levelFilter === 'all' || q.jlptLevel === levelFilter)
                    .map(item => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <LevelBadge level={item.jlptLevel} size="sm" />
                            <h4 className="font-bold text-sm">{item.title}</h4>
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {item.questions.length} асуулт
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal('quizzes', item)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('quizzes', item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CRUD Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {editingItem ? 'Засварлах' : 'Шинээр нэмэх'} — {navItems.find(n => n.id === modalType)?.label}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Common JLPT level select */}
              <div>
                <label className="block font-bold mb-1">JLPT Түвшин</label>
                <select
                  value={formData.jlptLevel || 'N5'}
                  onChange={e => setFormData({ ...formData, jlptLevel: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
                >
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>

              {/* Vocab Form Fields */}
              {modalType === 'vocab' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Япон үг (Ханз/Хирагана)</label>
                      <input
                        required
                        type="text"
                        value={formData.japanese || ''}
                        onChange={e => setFormData({ ...formData, japanese: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Уншлага (Хирагана)</label>
                      <input
                        required
                        type="text"
                        value={formData.reading || ''}
                        onChange={e => setFormData({ ...formData, reading: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Монгол утга</label>
                      <input
                        required
                        type="text"
                        value={formData.mongolian || ''}
                        onChange={e => setFormData({ ...formData, mongolian: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Үгийн аймаг</label>
                      <input
                        type="text"
                        value={formData.partOfSpeech || ''}
                        onChange={e => setFormData({ ...formData, partOfSpeech: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Монгол тайлбар</label>
                    <textarea
                      rows={2}
                      value={formData.explanation || ''}
                      onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>

                  <div className="border-t border-stone-200 dark:border-stone-800 pt-3 space-y-2">
                    <label className="block font-bold">Жишээ өгүүлбэр</label>
                    <input
                      type="text"
                      placeholder="Жишээ: 毎日日本語を勉強します。"
                      value={formData.exampleSentence || ''}
                      onChange={e => setFormData({ ...formData, exampleSentence: e.target.value })}
                      className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp"
                    />
                    <input
                      type="text"
                      placeholder="Уншлага: まいにちにほんごをべんきょうします。"
                      value={formData.exampleReading || ''}
                      onChange={e => setFormData({ ...formData, exampleReading: e.target.value })}
                      className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp"
                    />
                    <input
                      type="text"
                      placeholder="Монгол орчуулга: Өдөр бүр япон хэл сурдаг."
                      value={formData.exampleMongolian || ''}
                      onChange={e => setFormData({ ...formData, exampleMongolian: e.target.value })}
                      className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>
                </>
              )}

              {/* Kanji Form Fields */}
              {modalType === 'kanji' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Канжи тэмдэгт</label>
                      <input
                        required
                        type="text"
                        value={formData.kanji || ''}
                        onChange={e => setFormData({ ...formData, kanji: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp text-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Онь-уншлага (Onyomi)</label>
                      <input
                        type="text"
                        value={formData.onyomi || ''}
                        onChange={e => setFormData({ ...formData, onyomi: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Күн-уншлага (Kunyomi)</label>
                      <input
                        type="text"
                        value={formData.kunyomi || ''}
                        onChange={e => setFormData({ ...formData, kunyomi: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Монгол утга</label>
                    <input
                      required
                      type="text"
                      value={formData.mongolian || ''}
                      onChange={e => setFormData({ ...formData, mongolian: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>

                  <div className="border-t border-stone-200 dark:border-stone-800 pt-3 space-y-2">
                    <label className="block font-bold">Жишээ өгүүлбэр</label>
                    <input
                      type="text"
                      placeholder="Жишээ: 日本に行きます。"
                      value={formData.exampleSentence || ''}
                      onChange={e => setFormData({ ...formData, exampleSentence: e.target.value })}
                      className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 font-jp"
                    />
                    <input
                      type="text"
                      placeholder="Монгол орчуулга: Япон руу явна."
                      value={formData.exampleMongolian || ''}
                      onChange={e => setFormData({ ...formData, exampleMongolian: e.target.value })}
                      className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                    />
                  </div>
                </>
              )}

              {/* Grammar Form Fields */}
              {modalType === 'grammar' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Дүрмийн загвар</label>
                    <input
                      required
                      type="text"
                      placeholder="Жишээ: 〜てはいけません"
                      value={formData.pattern || ''}
                      onChange={e => setFormData({ ...formData, pattern: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-jp"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Монгол утга</label>
                    <input
                      required
                      type="text"
                      placeholder="Жишээ: ...ж/ч болохгүй"
                      value={formData.mongolian || ''}
                      onChange={e => setFormData({ ...formData, mongolian: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Дэлгэрэнгүй Монгол тайлбар</label>
                    <textarea
                      rows={3}
                      value={formData.explanation || ''}
                      onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Хэрэглэх дүрэм</label>
                      <input
                        type="text"
                        value={formData.usage || ''}
                        onChange={e => setFormData({ ...formData, usage: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Бүтэц</label>
                      <input
                        type="text"
                        value={formData.structure || ''}
                        onChange={e => setFormData({ ...formData, structure: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Lessons Form Fields */}
              {modalType === 'lessons' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Хичээлийн гарчиг</label>
                      <input
                        required
                        type="text"
                        value={formData.title || ''}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Дараалал (Бүлэг #)</label>
                      <input
                        type="number"
                        value={formData.order || 1}
                        onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                        className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Товч тайлбар</label>
                    <input
                      type="text"
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Хичээлийн бүрэн агуулга (Текст / Тайлбар)</label>
                    <textarea
                      rows={6}
                      value={formData.content || ''}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {/* Sentences Form Fields */}
              {modalType === 'sentences' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Япон өгүүлбэр</label>
                    <input
                      required
                      type="text"
                      value={formData.japanese || ''}
                      onChange={e => setFormData({ ...formData, japanese: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 font-jp"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Уншлага</label>
                    <input
                      type="text"
                      value={formData.reading || ''}
                      onChange={e => setFormData({ ...formData, reading: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 font-jp"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Монгол орчуулга</label>
                    <input
                      required
                      type="text"
                      value={formData.mongolian || ''}
                      onChange={e => setFormData({ ...formData, mongolian: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                    />
                  </div>
                </>
              )}

              {/* Reading Form Fields */}
              {modalType === 'reading' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Гарчиг</label>
                    <input
                      required
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Япон эх бичвэр</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.japaneseText || ''}
                      onChange={e => setFormData({ ...formData, japaneseText: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 font-jp"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Монгол орчуулга</label>
                    <textarea
                      rows={3}
                      value={formData.mongolianTranslation || ''}
                      onChange={e => setFormData({ ...formData, mongolianTranslation: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                    />
                  </div>
                </>
              )}

              {/* Listening Form Fields */}
              {modalType === 'listening' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Гарчиг</label>
                    <input
                      required
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                    />
                  </div>
                </>
              )}

              {/* Quizzes Form Fields */}
              {modalType === 'quizzes' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Тестийн гарчиг</label>
                    <input
                      required
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 font-bold hover:bg-stone-200"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20"
                >
                  Хадгалах
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
