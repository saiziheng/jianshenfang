'use client';

import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  ListChecks,
  Layers,
  Printer,
  RotateCcw,
  Save,
  Search,
  Sparkles
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import courseDataJson from './course-data.json';
import styles from './page.module.css';

type Stage = {
  stage: string;
  days: string;
  goal: string;
  deliverable: string;
};

type ScheduleDay = {
  day: number;
  module: string;
  objectives: string;
  topics: string[];
  practice: string;
  deliverable: string;
  checkpoint?: string;
  hours: string;
};

type Exercise = {
  day: number;
  title: string;
  task: string;
  submit: string;
  criteria: string;
  score: number;
};

type Rubric = {
  dimension: string;
  weight: number;
  excellent: string;
  qualified: string;
  needs_work: string;
};

type CourseData = {
  projectName: string;
  versionDate: string;
  versionNote?: string;
  positioning?: {
    provider?: string;
    toolPolicy?: string;
    marketFit?: string;
    tracks?: string[];
    learnerLevels?: Array<{
      level: string;
      user: string;
      outcome: string;
    }>;
  };
  stages: Stage[];
  schedule: ScheduleDay[];
  exercises: Exercise[];
  rubric: Rubric[];
  fieldGroups?: Record<string, string[]>;
};

type DayEntry = Record<string, string>;
type SavedEntries = Record<number, DayEntry>;
type Mode = 'teaching' | 'materials';

const STORAGE_KEY = 'seedance-course-workbench-v1';
const TEACHING_STORAGE_KEY = 'seedance-teaching-structure-v1';
const INITIAL_COURSE_DATA = courseDataJson as CourseData;

const FIELD_GROUPS: Record<number, string[]> = {
  1: ['学员类型', '创作赛道', '目标观众', '作品目标', 'Seedance入口', '首条成片链接'],
  2: ['Prompt骨架', '主体与动作', '场景与光线', '镜头与运镜', '风格/声音约束', '三版测试结果'],
  3: ['参考素材', '授权说明', '一致性变量', '图生视频Prompt', '测试结果', '素材缺口'],
  4: ['镜头表', '运镜Prompt', '节奏设计', '声音意图', '可用Take', '修复点'],
  5: ['3秒钩子', '栏目模板', '15秒脚本', 'Seedance版本', '亮点评估', '改稿记录'],
  6: ['信息对象', '信息转画面', '参考素材', '介绍分镜', '生成版本', '合规自查'],
  7: ['知识点', '受众水平', '可视化比喻', '解释分镜', '生成版本', '理解反馈'],
  8: ['人物设定', '冲突/反转', '多镜头分镜', '角色一致性', '成片链接', '续集想法'],
  9: ['问题镜头', '问题分类', '修复Prompt', '延展/编辑说明', '版本对比', '保留规则'],
  10: ['内容矩阵', '三类变体', 'Prompt模板', '批量规则', '发布标题', '复用资产'],
  11: ['作品集标题', '项目说明', '过程截图', '成片链接', '发布文案', '公开授权'],
  12: ['终版作品包', '路演稿', '个人定位', '后续计划', '课程反馈', '可公开授权']
};

const STAGE_ACCENTS = ['blue', 'teal', 'amber'] as const;
const DAILY_STRUCTURE = [
  {
    id: 'prep',
    title: '课前准备',
    level: '老师',
    duration: '课前',
    fields: ['本日讲义/素材', '演示账号/链接', '注意事项']
  },
  {
    id: 'intro',
    title: '讲解内容',
    level: '全班',
    duration: '讲授',
    fields: ['核心概念', '讲解顺序', '板书/投屏要点']
  },
  {
    id: 'demo',
    title: '现场演示',
    level: '全班',
    duration: '演示',
    fields: ['演示目标', '操作步骤', '常见问题']
  },
  {
    id: 'practice',
    title: '课堂练习',
    level: 'L1/L2/L3',
    duration: '练习',
    fields: ['基础任务', '进阶任务', '项目任务']
  },
  {
    id: 'review',
    title: '点评反馈',
    level: '小组/个人',
    duration: '点评',
    fields: ['点评标准', '共性问题', '优秀案例记录']
  },
  {
    id: 'close',
    title: '课后安排',
    level: '全班',
    duration: '课后',
    fields: ['作业要求', '提交方式', '下次衔接']
  }
];
const LEARNING_LEVELS = [
  { id: 'l1', label: 'L1', title: '基础层', fields: ['讲解重点', '练习要求'] },
  { id: 'l2', label: 'L2', title: '提升层', fields: ['讲解重点', '练习要求'] },
  { id: 'l3', label: 'L3', title: '项目层', fields: ['讲解重点', '练习要求'] }
];

function loadSavedEntries(): SavedEntries {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedEntries) : {};
  } catch {
    return {};
  }
}

function loadStorageEntries(key: string): SavedEntries {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SavedEntries) : {};
  } catch {
    return {};
  }
}

function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildMarkdown(data: CourseData, entries: SavedEntries, teachingEntries: SavedEntries) {
  const lines = [`# ${data.projectName} 教学网页记录`, '', `版本：${data.versionDate}`, ''];

  data.schedule.forEach((day) => {
    lines.push(`## Day ${day.day} ${day.module}`, '');
    lines.push(`- 目标：${day.objectives}`);
    lines.push(`- 实操：${day.practice}`);
    lines.push(`- 交付：${day.deliverable}`);
    lines.push('');

    const teachingEntry = teachingEntries[day.day] ?? {};
    lines.push('### 授课结构', '');
    DAILY_STRUCTURE.forEach((block) => {
      lines.push(`#### ${block.title}`, '');
      block.fields.forEach((field) => {
        const key = buildTeachingKey(block.title, field);
        lines.push(`- ${field}：${teachingEntry[key]?.trim() || '未填写'}`);
      });
      lines.push('');
    });

    lines.push('### 分层安排', '');
    LEARNING_LEVELS.forEach((level) => {
      lines.push(`#### ${level.label} ${level.title}`, '');
      level.fields.forEach((field) => {
        const key = buildTeachingKey(`${level.label}${level.title}`, field);
        lines.push(`- ${field}：${teachingEntry[key]?.trim() || '未填写'}`);
      });
      lines.push('');
    });

    const entry = entries[day.day] ?? {};
    lines.push('### 学员材料填写', '');
    getDayFields(data, day.day).forEach((field) => {
      lines.push(`#### ${field}`, '');
      lines.push(entry[field]?.trim() || '未填写');
      lines.push('');
    });
  });

  return lines.join('\n');
}

function countCompleted(entry: DayEntry | undefined, fields: string[]) {
  if (!entry) return 0;
  return fields.filter((field) => entry[field]?.trim()).length;
}

function getDayFields(data: CourseData | null, day: number) {
  return data?.fieldGroups?.[String(day)] ?? FIELD_GROUPS[day] ?? [];
}

function buildTeachingKey(group: string, field: string) {
  return `${group}｜${field}`;
}

export function CourseWorkbenchClient() {
  const [courseData] = useState<CourseData | null>(INITIAL_COURSE_DATA);
  const [selectedDay, setSelectedDay] = useState(1);
  const [mode, setMode] = useState<Mode>('teaching');
  const [entries, setEntries] = useState<SavedEntries>({});
  const [teachingEntries, setTeachingEntries] = useState<SavedEntries>({});
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [statusText, setStatusText] = useState('已开启本地保存');

  useEffect(() => {
    setEntries(loadSavedEntries());
    setTeachingEntries(loadStorageEntries(TEACHING_STORAGE_KEY));
    setEntriesLoaded(true);
  }, []);

  useEffect(() => {
    if (!courseData || !entriesLoaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.localStorage.setItem(TEACHING_STORAGE_KEY, JSON.stringify(teachingEntries));
  }, [courseData, entries, entriesLoaded, teachingEntries]);

  const currentDay = useMemo(
    () => courseData?.schedule.find((day) => day.day === selectedDay),
    [courseData, selectedDay]
  );
  const currentExercise = useMemo(
    () => courseData?.exercises.find((exercise) => exercise.day === selectedDay),
    [courseData, selectedDay]
  );
  const fields = getDayFields(courseData, selectedDay);
  const dayEntry = entries[selectedDay] ?? {};
  const teachingDayEntry = teachingEntries[selectedDay] ?? {};
  const totalHours =
    courseData?.schedule.reduce((sum, day) => {
      const numericHours = Number.parseFloat(day.hours);
      return Number.isFinite(numericHours) ? sum + numericHours : sum;
    }, 0) ?? 0;
  const courseTitle = courseData?.projectName.replace(/（.*?）/g, '') ?? '';

  function updateField(field: string, value: string) {
    setEntries((prev) => ({
      ...prev,
      [selectedDay]: {
        ...(prev[selectedDay] ?? {}),
        [field]: value
      }
    }));
    setStatusText('已自动保存到本机浏览器');
  }

  function updateTeachingField(field: string, value: string) {
    setTeachingEntries((prev) => ({
      ...prev,
      [selectedDay]: {
        ...(prev[selectedDay] ?? {}),
        [field]: value
      }
    }));
    setStatusText('已自动保存到本机浏览器');
  }

  function resetCurrentDay() {
    const confirmed = window.confirm(`确认清空 Day ${selectedDay} 的填写内容？`);
    if (!confirmed) return;

    setEntries((prev) => {
      const next = { ...prev };
      delete next[selectedDay];
      return next;
    });
    setTeachingEntries((prev) => {
      const next = { ...prev };
      delete next[selectedDay];
      return next;
    });
    setStatusText(`已清空 Day ${selectedDay}`);
  }

  function exportJson() {
    if (!courseData) return;
    downloadText(
      `AI视频课程填写记录-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ course: courseData.projectName, versionDate: courseData.versionDate, entries, teachingEntries }, null, 2),
      'application/json;charset=utf-8'
    );
  }

  function exportMarkdown() {
    if (!courseData) return;
    downloadText(`AI视频课程填写记录-${new Date().toISOString().slice(0, 10)}.md`, buildMarkdown(courseData, entries, teachingEntries));
  }

  if (!courseData || !currentDay) {
    return (
      <main className={styles.shell}>
        <div className={styles.loadingPanel}>
          <Sparkles size={24} />
          <span>正在加载课程工作台...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.topbar}>
        <div>
          <p className={styles.kicker}>老师授课整理页</p>
          <h1>{courseTitle}</h1>
          <p className={styles.subtitle}>按天整理讲解、演示、练习、点评和作业。</p>
        </div>

        <div className={styles.actions} aria-label="导出与打印">
          <button type="button" onClick={exportJson} className={styles.iconButton}>
            <Download size={17} />
            JSON
          </button>
          <button type="button" onClick={exportMarkdown} className={styles.iconButton}>
            <FileText size={17} />
            Markdown
          </button>
          <button type="button" onClick={() => window.print()} className={styles.iconButton}>
            <Printer size={17} />
            打印
          </button>
        </div>
      </section>

      <section className={styles.metricsBand} aria-label="课程总览">
        <div>
          <CalendarDays size={20} />
          <strong>12天</strong>
          <span>课程周期</span>
        </div>
        <div>
          <Layers size={20} />
          <strong>Seedance</strong>
          <span>唯一生成工具</span>
        </div>
        <div>
          <ClipboardList size={20} />
          <strong>{totalHours || 36}h</strong>
          <span>建议课时</span>
        </div>
        <div>
          <Save size={20} />
          <strong>保存</strong>
          <span>{statusText}</span>
        </div>
      </section>

      <section className={styles.modeBar} aria-label="网页模式">
        <button
          type="button"
          className={mode === 'teaching' ? styles.modeButtonActive : styles.modeButton}
          onClick={() => setMode('teaching')}
        >
          <ListChecks size={16} />
          授课整理
        </button>
        <button
          type="button"
          className={mode === 'materials' ? styles.modeButtonActive : styles.modeButton}
          onClick={() => setMode('materials')}
        >
          <BookOpen size={16} />
          课程内容
        </button>
      </section>

      <section className={styles.stageGrid} aria-label="课程阶段">
        {courseData.stages.map((stage, index) => (
          <button
            type="button"
            key={stage.stage}
            className={`${styles.stagePanel} ${styles[STAGE_ACCENTS[index] ?? 'blue']}`}
            onClick={() => setSelectedDay(index * 4 + 1)}
          >
            <span>{stage.days}</span>
            <strong>{stage.stage}</strong>
          </button>
        ))}
      </section>

      <div className={styles.workbenchGrid}>
        <aside className={styles.dayRail} aria-label="每日课程目录">
          <div className={styles.railHeader}>
            <BookOpen size={18} />
            <span>12天目录</span>
          </div>
          {courseData.schedule.map((day) => {
            const dayFields = getDayFields(courseData, day.day);
            const done = countCompleted(entries[day.day], dayFields);
            return (
              <button
                type="button"
                key={day.day}
                className={day.day === selectedDay ? styles.dayButtonActive : styles.dayButton}
                onClick={() => setSelectedDay(day.day)}
              >
                <span>Day {day.day}</span>
                <strong>{day.module}</strong>
                <em>
                  {mode === 'materials' ? `${done}/${dayFields.length} 已填` : '授课整理'}
                </em>
              </button>
            );
          })}
        </aside>

        <section className={styles.detail}>
          <div className={styles.dayHeader}>
            <div>
              <p className={styles.kicker}>Day {currentDay.day}</p>
              <h2>{currentDay.module}</h2>
              {mode === 'materials' ? <p>{currentDay.objectives}</p> : null}
            </div>
            <button type="button" onClick={resetCurrentDay} className={styles.secondaryButton}>
              <RotateCcw size={16} />
              清空本日
            </button>
          </div>

          {mode === 'teaching' ? (
            <>
              <section className={styles.teachingSection}>
                <div className={styles.formHeader}>
                  <div>
                    <h3>每日授课结构</h3>
                    <p>填写本日授课内容。</p>
                  </div>
                  <div className={styles.saveHint}>
                    <Save size={15} />
                    授课版
                  </div>
                </div>
                <div className={styles.structureGrid}>
                  {DAILY_STRUCTURE.map((block, index) => (
                    <section key={block.id} className={styles.structurePanel}>
                      <div className={styles.structureHead}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <strong>{block.title}</strong>
                          <em>
                            {block.level} · {block.duration}
                          </em>
                        </div>
                      </div>
                      <div className={styles.miniFieldGrid}>
                        {block.fields.map((field) => {
                          const key = buildTeachingKey(block.title, field);
                          return (
                            <label key={key} className={styles.field}>
                              <span>{field}</span>
                              <textarea
                                value={teachingDayEntry[key] ?? ''}
                                onInput={(event) => updateTeachingField(key, event.currentTarget.value)}
                                placeholder={`填写${field}...`}
                                rows={3}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </section>

              <section className={styles.teachingSection}>
                <div className={styles.formHeader}>
                  <div>
                    <h3>分级任务窗口</h3>
                    <p>填写分层讲法和任务。</p>
                  </div>
                </div>
                <div className={styles.levelGrid}>
                  {LEARNING_LEVELS.map((level) => (
                    <section key={level.id} className={styles.levelPanel}>
                      <div className={styles.levelBadge}>{level.label}</div>
                      <h4>{level.title}</h4>
                      {level.fields.map((field) => {
                        const key = buildTeachingKey(`${level.label}${level.title}`, field);
                        return (
                          <label key={key} className={styles.field}>
                            <span>{field}</span>
                            <textarea
                              value={teachingDayEntry[key] ?? ''}
                              onInput={(event) => updateTeachingField(key, event.currentTarget.value)}
                              placeholder={`填写${field}...`}
                              rows={3}
                            />
                          </label>
                        );
                      })}
                    </section>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <div className={styles.infoGrid}>
                <section>
                  <h3>核心主题</h3>
                  <ul>
                    {currentDay.topics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>实操与交付</h3>
                  <dl>
                    <dt>实操任务</dt>
                    <dd>{currentDay.practice}</dd>
                    <dt>当日交付</dt>
                    <dd>{currentDay.deliverable}</dd>
                    <dt>检查点</dt>
                    <dd>{currentDay.checkpoint ?? '按老师要求完成当日检查'}</dd>
                  </dl>
                </section>
              </div>

              {currentExercise ? (
                <section className={styles.exerciseBand}>
                  <Search size={18} />
                  <div>
                    <h3>{currentExercise.title}</h3>
                    <p>{currentExercise.task}</p>
                    <span>
                      提交：{currentExercise.submit} · {currentExercise.score}分 · {currentExercise.criteria}
                    </span>
                  </div>
                </section>
              ) : null}

              <section className={styles.formSection}>
                <div className={styles.formHeader}>
                  <div>
                    <h3>学员填写窗口</h3>
                    <p>内容自动保存在本机浏览器，刷新页面不会丢失。</p>
                  </div>
                  <div className={styles.saveHint}>
                    <Save size={15} />
                    {countCompleted(dayEntry, fields)}/{fields.length}
                  </div>
                </div>

                <div className={styles.fieldGrid}>
                  {fields.map((field) => (
                    <label key={field} className={styles.field}>
                      <span>{field}</span>
                      <textarea
                        value={dayEntry[field] ?? ''}
                        onInput={(event) => updateField(field, event.currentTarget.value)}
                        placeholder={`填写${field}...`}
                        rows={4}
                      />
                    </label>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className={styles.rubricBand}>
            <h3>终评权重</h3>
            <div className={styles.rubricGrid}>
              {courseData.rubric.map((item) => (
                <div key={item.dimension}>
                  <strong>{item.weight}%</strong>
                  <span>{item.dimension}</span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
