import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const U = (n) => `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${n}.mp4`;

const VIDEOS = [
  { id: 'w1', title: '5分钟全身动态热身', coach: 'Lin', type: 'warmup', duration: 300, equipment: ['none'], tags: ['全身'], contra: [], url: U('BigBuckBunny') },
  { id: 'w2', title: '8分钟下肢动态热身', coach: 'Wu', type: 'warmup', duration: 480, equipment: ['none'], tags: ['下肢'], contra: [], url: U('ForBiggerFun') },
  { id: 'w3', title: '5分钟有氧热身', coach: 'Wu', type: 'warmup', duration: 300, equipment: ['none'], tags: ['有氧'], contra: [], url: U('ForBiggerJoyrides') },
  { id: 's1', title: '20分钟全身哑铃力量', coach: 'Chen', type: 'strength', duration: 1200, equipment: ['dumbbell'], tags: ['全身'], contra: [], url: U('ElephantsDream') },
  { id: 's2', title: '30分钟全身自重力量', coach: 'Chen', type: 'strength', duration: 1800, equipment: ['none'], tags: ['全身'], contra: [], url: U('ForBiggerBlazes') },
  { id: 's3', title: '25分钟上肢哑铃训练', coach: 'Zhao', type: 'strength', duration: 1500, equipment: ['dumbbell'], tags: ['上肢'], contra: [], url: U('TearsOfSteel') },
  { id: 's4', title: '25分钟臀腿训练', coach: 'Wu', type: 'strength', duration: 1500, equipment: ['none'], tags: ['下肢'], contra: ['knee'], url: U('ForBiggerMeltdowns') },
  { id: 'c1', title: '20分钟低冲击有氧', coach: 'Wu', type: 'cardio', duration: 1200, equipment: ['none'], tags: ['有氧'], contra: [], url: U('ForBiggerJoyrides') },
  { id: 'c2', title: '30分钟居家燃脂有氧', coach: 'Wu', type: 'cardio', duration: 1800, equipment: ['none'], tags: ['有氧'], contra: [], url: U('BigBuckBunny') },
  { id: 'h1', title: '15分钟初学者HIIT', coach: 'Chen', type: 'hiit', duration: 900, equipment: ['none'], tags: ['全身'], contra: ['knee'], url: U('Sintel') },
  { id: 'k1', title: '15分钟核心基础训练', coach: 'Lin', type: 'core', duration: 900, equipment: ['none'], tags: ['核心'], contra: [], url: U('ForBiggerEscapes') },
  { id: 'y1', title: '15分钟晨间瑜伽', coach: 'He', type: 'yoga', duration: 900, equipment: ['none'], tags: ['全身'], contra: [], url: U('ElephantsDream') },
  { id: 'y2', title: '10分钟全身拉伸', coach: 'He', type: 'stretch', duration: 600, equipment: ['none'], tags: ['全身'], contra: [], url: U('ForBiggerJoyrides') },
  { id: 'y3', title: '15分钟泡沫轴放松', coach: 'He', type: 'stretch', duration: 900, equipment: ['none'], tags: ['下肢'], contra: [], url: U('ForBiggerFun') },
];

const V_MAP = Object.fromEntries(VIDEOS.map((v) => [v.id, v]));

const TEMPLATES = {
  2: [
    { dayIndex: 0, theme: '全身力量', mainType: 'strength', tags: ['全身'] },
    { dayIndex: 3, theme: '有氧燃脂', mainType: 'cardio', tags: ['有氧'] },
  ],
  3: [
    { dayIndex: 0, theme: '全身力量', mainType: 'strength', tags: ['全身'] },
    { dayIndex: 2, theme: '有氧燃脂', mainType: 'cardio', tags: ['有氧'] },
    { dayIndex: 5, theme: '全身力量 + 核心', mainType: 'strength', tags: ['全身', '核心'] },
  ],
  4: [
    { dayIndex: 0, theme: '上肢力量', mainType: 'strength', tags: ['上肢'] },
    { dayIndex: 1, theme: '下肢 + 臀', mainType: 'strength', tags: ['下肢'] },
    { dayIndex: 3, theme: '有氧燃脂', mainType: 'cardio', tags: ['有氧'] },
    { dayIndex: 5, theme: '核心 + 柔韧', mainType: 'core', tags: ['核心'] },
  ],
  5: [
    { dayIndex: 0, theme: '上肢力量', mainType: 'strength', tags: ['上肢'] },
    { dayIndex: 1, theme: '下肢力量', mainType: 'strength', tags: ['下肢'] },
    { dayIndex: 2, theme: '有氧训练', mainType: 'cardio', tags: ['有氧'] },
    { dayIndex: 4, theme: 'HIIT 燃脂', mainType: 'hiit', tags: ['全身'] },
    { dayIndex: 6, theme: '拉伸恢复', mainType: 'stretch', tags: ['全身'] },
  ],
};

function calcHealth(p) {
  const age = +p.age || 25;
  const h = +p.heightCm || 170;
  const w = +p.weightKg || 65;
  const bmi = +(w / ((h / 100) ** 2)).toFixed(1);
  const bmr = Math.round(p.gender === 'male'
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161);
  const f = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[p.activityLevel] || 1.375;
  const tdee = Math.round(bmr * f);
  const delta = { fat_loss: -400, maintain: 0, muscle_gain: 250, endurance: 0 }[p.goal] || 0;
  const maxHR = Math.round(208 - 0.7 * age);
  const protein = Math.round(w * ((p.goal === 'muscle_gain' || p.goal === 'fat_loss') ? 1.8 : 1.4));
  return {
    bmi,
    bmiLabel: bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '偏胖' : '肥胖',
    bmr, tdee,
    targetCalories: tdee + delta,
    maxHR, protein,
    zones: {
      warmup: [Math.round(maxHR * 0.5), Math.round(maxHR * 0.6)],
      fatBurn: [Math.round(maxHR * 0.6), Math.round(maxHR * 0.7)],
      cardio: [Math.round(maxHR * 0.7), Math.round(maxHR * 0.8)],
      hiit: [Math.round(maxHR * 0.8), Math.round(maxHR * 0.9)],
    },
  };
}

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function generatePlan(prefs) {
  const freq = Math.max(2, Math.min(5, prefs.weeklyFrequency || 3));
  const slots = TEMPLATES[freq] || TEMPLATES[3];
  const monday = startOfWeek();
  const used = new Set();

  const allows = (v) => {
    if (v.contra.some((c) => (prefs.injuries || []).includes(c))) return false;
    const eq = prefs.equipment || ['none'];
    if (!v.equipment.every((e) => e === 'none' || eq.includes(e))) return false;
    return true;
  };

  const pick = (type, tags, exclude) => {
    const pool = VIDEOS.filter(allows).filter((v) => v.type === type && !exclude.has(v.id));
    if (!pool.length) return null;
    pool.sort((a, b) => {
      const sa = (tags.some((t) => a.tags.includes(t)) ? 10 : 0) + (prefs.preferredTypes?.includes(a.type) ? 5 : 0);
      const sb = (tags.some((t) => b.tags.includes(t)) ? 10 : 0) + (prefs.preferredTypes?.includes(b.type) ? 5 : 0);
      return sb - sa;
    });
    return pool[0];
  };

  const days = slots.map((slot, idx) => {
    const items = [];
    const warm = pick('warmup', slot.tags, used);
    if (warm) { used.add(warm.id); items.push({ role: '热身', videoId: warm.id }); }
    const main = pick(slot.mainType, slot.tags, used);
    if (main) { used.add(main.id); items.push({ role: '主训练', videoId: main.id }); }
    const cool = pick('stretch', slot.tags, used);
    if (cool) { used.add(cool.id); items.push({ role: '冷身', videoId: cool.id }); }
    const totalSec = items.reduce((s, it) => s + (V_MAP[it.videoId]?.duration || 0), 0);
    return {
      id: `d${idx}`,
      dayIndex: slot.dayIndex,
      date: fmtDate(addDays(monday, slot.dayIndex)),
      theme: slot.theme,
      estimatedMinutes: Math.round(totalSec / 60),
      items,
      completed: false,
    };
  });

  return { startDate: fmtDate(monday), endDate: fmtDate(addDays(monday, 6)), days };
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [plan, setPlan] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('home');
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('@fitplan/v1');
        if (raw) {
          const s = JSON.parse(raw);
          setProfile(s.profile || null);
          setPrefs(s.prefs || null);
          setPlan(s.plan || null);
          setLogs(s.logs || []);
        }
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  const save = async (next) => {
    try {
      await AsyncStorage.setItem('@fitplan/v1', JSON.stringify({
        profile: next.profile ?? profile,
        prefs: next.prefs ?? prefs,
        plan: next.plan ?? plan,
        logs: next.logs ?? logs,
      }));
    } catch (e) {}
  };

  const onboard = async (p, q) => {
    const newPlan = generatePlan(q);
    setProfile(p); setPrefs(q); setPlan(newPlan);
    await save({ profile: p, prefs: q, plan: newPlan });
  };

  const completeDay = async (day, rpe) => {
    const newPlan = { ...plan, days: plan.days.map((d) => d.id === day.id ? { ...d, completed: true } : d) };
    const newLogs = [...logs, {
      id: `${day.id}-${Date.now()}`,
      date: fmtDate(new Date()),
      theme: day.theme,
      durationSec: day.estimatedMinutes * 60,
      rpe,
    }];
    setPlan(newPlan); setLogs(newLogs);
    await save({ plan: newPlan, logs: newLogs });
    setDetailId(null);
  };

  const reset = async () => {
    await AsyncStorage.removeItem('@fitplan/v1');
    setProfile(null); setPrefs(null); setPlan(null); setLogs([]);
  };

  if (!ready) {
    return (
      <View style={S.splash}>
        <Text style={S.splashText}>FitPlan AI</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (!profile) return <Onboarding onDone={onboard} />;

  if (detailId) {
    const day = plan.days.find((d) => d.id === detailId);
    return <WorkoutDetail day={day} onBack={() => setDetailId(null)} onComplete={(rpe) => completeDay(day, rpe)} />;
  }

  const health = calcHealth(profile);
  const todayDay = plan?.days.find((d) => d.date === fmtDate(new Date()));

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {tab === 'home' && <HomeTab health={health} todayDay={todayDay} logs={logs} onStart={setDetailId} />}
          {tab === 'plan' && <PlanTab plan={plan} onOpen={setDetailId} />}
          {tab === 'progress' && <ProgressTab logs={logs} />}
          {tab === 'me' && <MeTab profile={profile} prefs={prefs} onReset={reset} />}
        </ScrollView>
      </SafeAreaView>
      <TabBar tab={tab} setTab={setTab} />
    </View>
  );
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState('female');
  const [age, setAge] = useState('28');
  const [heightCm, setHeightCm] = useState('165');
  const [weightKg, setWeightKg] = useState('60');
  const [activityLevel, setActivityLevel] = useState('light');
  const [goal, setGoal] = useState('fat_loss');
  const [weeklyFrequency, setWeeklyFrequency] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(40);
  const [preferredTypes, setPreferredTypes] = useState(['strength', 'cardio']);
  const [equipment, setEquipment] = useState(['none', 'dumbbell']);
  const [injuries, setInjuries] = useState([]);

  const toggle = (arr, setArr, v) => setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const Chip = ({ label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[S.chip, active && S.chipActive]}>
      <Text style={[S.chipText, active && S.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Text style={{ color: '#7A7F87', fontSize: 13 }}>第 {step} / 3 步</Text>
        <View style={S.prog}><View style={[S.progFill, { width: `${(step / 3) * 100}%` }]} /></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {step === 1 && (
          <>
            <Text style={S.h1}>先认识一下你</Text>
            <Text style={S.sub}>用于计算 BMI、基础代谢和心率区间</Text>
            <Text style={S.label}>性别</Text>
            <View style={S.row}>
              <Chip label="女" active={gender === 'female'} onPress={() => setGender('female')} />
]}
              <Chip label="男" active={gender === 'male'} onPress={() => setGender('male')} />
            </View>
            <Text style={S.label}>年龄</Text>
            <TextInput style={S.input} keyboardType="number-pad" value={age} onChangeText={setAge} />
            <Text style={S.label}>身高 (cm)</Text>
            <TextInput style={S.input} keyboardType="number-pad" value={height         Cm} onChangeText={setHeightCm >
} />
            <           Text style={S.label}>体重 < (kg)</Text>
           View <TextInput style={S.input style} keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
            <Text style={S.label}>日常活动量</Text>
            {[['sedentary', '久坐'], ['light', '轻度（每周1-3次）'], ['moderate', '中度（每周3-5次）'], ['active', '高度（每周6-7次）']].map(([k, l]) => (
              <Chip key={k} label={l} active={activityLevel === k} onPress={() => setActivityLevel(k)} />
            ))}
            <Text style={S.label}>目标</Text>
            <View style={S.rowWrap}>
              {[['fat_loss', '减脂'], ['maintain', '保持健康'], ['muscle_gain', '增肌'], ['endurance', '提升体能']].map(([k, l]) => (
                <Chip key={k} label={l} active={goal === k} onPress={() => setGoal(k)} />
              ))}
            </View>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={S.h1}>训练频率</Text>
            <Text style={S.sub}>计划会根据你每周能练几次来排课</Text>
            <Text style={S.label}>每周训练次数</Text>
            <View style={S.rowWrap}>
              {[2, 3, 4, 5].map((n) => <Chip key={n} label={`${n} 次`} active={weeklyFrequency === n} onPress={() => setWeeklyFrequency(n)} />)}
            </View>
            <Text style={S.label}>单次时长</Text>
            <View style={S.rowWrap}>
              {[20, 30, 40, 50, 60].map((n) => <Chip key={n} label={`${n} 分钟`} active={sessionMinutes === n} onPress={() => setSessionMinutes(n)} />)}
            </View>
            <Text style={S.label}>喜欢的训练类型</Text>
            <View style={S.rowWrap}>
              {[['strength', '力量'], ['cardio', '有氧'], ['hiit', 'HIIT'], ['core', '核心'], ['yoga', '瑜伽'], ['stretch', '拉伸']].map(([k, l]) => (
                <Chip key={k} label={l} active={preferredTypes.includes(k)} onPress={() => toggle(preferredTypes, setPreferredTypes, k)} />
              ))}
            </View>
          </>
        )}
        {step === 3 && (
          <>
            <Text style={S.h1}>器械与安全</Text>
            <Text style={S.sub}>决定给你匹配哪些跟练视频</Text>
            <Text style={S.label}>可用器械</Text>
            <View style={S.rowWrap}>
              {[['none', '无器械'], ['dumbbell', '哑铃'], ['band', '弹力带'], ['gym', '健身房']].map(([k, l]) => (
                <Chip key={k} label={l} active={equipment.includes(k)} onPress={() => toggle(equipment, setEquipment, k)} />
              ))}
            </View>
            <Text style={S.label}>有疼痛或伤病的部位？</Text>
            <View style={S.rowWrap}>
              {[['knee', '膝关节'], ['low_back', '腰部'], ['shoulder', '肩部']].map(([k, l]) => (
                <Chip key={k} label={l} active={injuries.includes(k)} onPress={() => toggle(injuries, setInjuries, k)} />
              ))}
            </View>
            <View style={S.notice}>
              <Text style={{ color: '#8A6100', fontSize: 13, lineHeight: 20 }}>
                本应用不能替代医生或康复师。如有心血管疾病、孕期、术后恢复等情况，请先咨询医生。
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      <View style={{ flexDirection: 'row', padding: 20, gap: 12 }}>
        {step > 1 && (
          <TouchableOpacity style={S.btnGhost} onPress={() => setStep(step - 1)}>
            <Text style={{ color: '#1A1A1A', fontWeight: '700' }}>上一步</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={S.btnPrimary} onPress={() => step < 3 ? setStep(step + 1) : onDone(
          { gender, age: +age, heightCm: +heightCm, weightKg: +weightKg, activityLevel, goal },
          { weeklyFrequency, sessionMinutes, preferredTypes, equipment, injuries }
        )}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{step === 3 ? '生成我的计划' : '下一步'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function HomeTab({ health, todayDay, logs, onStart }) {
  const streak = (() => {
    const dates = [...new Set(logs.map((l) => l.date))].sort().reverse();
    let s = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const k = fmtDate(d);
      if (dates.includes(k)) { s++; d.setDate(d.getDate() - 1); }
      else if (i === 0) d.setDate(d.getDate() - 1);
      else break;
    }
    return s;
  })();

  return (
    <>
      <View style={S.hero}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>你好，今天也要加油</Text>
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 6 }}>FitPlan AI</Text>
        <View style={{ flexDirection: 'row', gap: 48, marginTop: 22 }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>连续打卡</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 }}>{streak} 天</Text>
          </View>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>总训练</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 }}>{logs.length} 次</Text>
          </View>
        </View>
      </View>

      {todayDay ? (
        <View style={S.card}>
          <Text style={{ fontSize: 16, fontWeight: '800' }}>今日训练</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 12 }}>{todayDay.theme}</Text>
          <Text style={{ color: '#7A7F87', fontSize: 13, marginTop: 6 }}>
            约 {todayDay.estimatedMinutes} 分钟 · {todayDay.items.length} 个视频
          </Text>
          <TouchableOpacity
            style={[S.btnPrimary, { marginTop: 16 }, todayDay.completed && { backgroundColor: '#2FBF71' }]}
            onPress={() => onStart(todayDay.id)}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
              {todayDay.completed ? '已完成' : '开始训练'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={S.card}>
          <Text style={{ fontSize: 16, fontWeight: '800' }}>今天是休息日</Text>
          <Text style={{ color: '#7A7F87', marginTop: 8 }}>散步、拉伸，或看看本周计划</Text>
        </View>
      )}

      <Text style={S.section}>健康概览</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 }}>
        {[['BMI', health.bmi, health.bmiLabel], ['基础代谢', health.bmr, 'kcal'], ['每日消耗', health.tdee, 'kcal'], ['目标热量', health.targetCalories, 'kcal'], ['最大心率', health.maxHR, 'bpm'], ['蛋白质', health.protein, 'g/天']].map(([label, value, hint]) => (
          <View key={label} style={S.statCard}>
            <Text style={{ color: '#7A7F87', fontSize: 12 }}>{label}</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 6 }}>{value}</Text>
            <Text style={{ color: '#7A7F87', fontSize: 11, marginTop: 4 }}>{hint}</Text>
          </View>
        ))}
      </View>

      <Text style={S.section}>心率区间</Text>
      <View style={S.card}>
        {[['热身', health.zones.warmup, '#7A7F87'], ['燃脂', health.zones.fatBurn, '#2FBF71'], ['有氧', health.zones.cardio, '#F5A623'], ['高强度', health.zones.hiit, '#E5484D']].map(([label, range, color]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 12 }} />
            <Text style={{ flex: 1 }}>{label}</Text>
            <Text style={{ color: '#7A7F87', fontSize: 13, fontWeight: '600' }}>{range[0]} - {range[1]} bpm</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function PlanTab({ plan, onOpen }) {
  const WEEK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const today = fmtDate(new Date());
  if (!plan) return <Text style={{ padding: 20 }}>还没有计划</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: '800' }}>本周计划</Text>
      <Text style={{ color: '#7A7F87', fontSize: 13, marginTop: 4, marginBottom: 16 }}>
        {plan.startDate} ~ {plan.endDate}
      </Text>
      {WEEK.map((label, idx) => {
        const day = plan.days.find((d) => d.dayIndex === idx);
        const isToday = day?.date === today;
        if (!day) {
          return (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#7A7F87', fontSize: 13, fontWeight: '700', width: 50 }}>{label}</Text>
              <View style={{ flex: 1, backgroundColor: '#F0F1F4', borderRadius: 16, padding: 18, marginLeft: 12 }}>
                <Text style={{ color: '#7A7F87' }}>休息 / 主动恢复</Text>
              </View>
            </View>
          );
        }
        return (
          <TouchableOpacity
            key={label}
            onPress={() => onOpen(day.id)}
            style={[S.dayCard, isToday && { borderWidth: 2, borderColor: '#FF5A5F' }={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: isToday ? '#FF5A5F' : '#7A7F87', fontSize: 13, fontWeight: '700' }}>
                {label} {isToday ? '· 今天' : ''}
              </Text>
              {day.completed && <Text style={{ color: '#2FBF71', fontSize: 12, fontWeight: '700' }}>已完成</Text>}
            </View>
            <Text style={{ fontSize: 19, fontWeight: '800', marginTop: 8 }}>{day.theme}</Text>
            <Text style={{ color: '#7A7F87', fontSize: 13, marginTop: 6 }}>
              {day.estimatedMinutes} 分钟 · {day.items.length} 个视频
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function WorkoutDetail({ day, onBack, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [rpe, setRpe] = useState(5);
  const current = V_MAP[day.items[idx]?.videoId];
  const fmtT = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <TouchableOpacity onPress={onBack} style={{ width: 60 }}>
          <Text style={{ color: '#FF5A5F', fontSize: 15, fontWeight: '700' }}>返回</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>{day.theme}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView>
        {current ? (
          <Video
            key={current.id}
            source={{ uri: current.url }}
            style={{ width: '100%', height: 220, backgroundColor: '#000' }}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
          />
        ) : (
          <View style={{ height: 220, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff' }}>暂无视频</Text>
          </View>
        )}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '800' }}>{current?.title}</Text>
          <Text style={{ color: '#7A7F87', fontSize: 13, marginTop: 6 }}>
            {current?.coach} · {fmtT(current?.duration || 0)}
          </Text>

          <Text style={S.section}>今日清单 · 共 {day.estimatedMinutes} 分钟</Text>
          {day.items.map((it, i) => {
            const v = V_MAP[it.videoId];
            if (!v) return null;
            const active = i === idx;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setIdx(i)}
                style={[S.item, active && { borderWidth: 2, borderColor: '#FF5A5F' }]}
              >
                <View style={[S.roleTag, active && { backgroundColor: '#FF5A5F' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : '#7A7F87' }}>{it.role}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '700' }} numberOfLines={1}>{v.title}</Text>
                  <Text style={{ color: '#7A7F87', fontSize: 12, marginTop: 4 }}>{v.coach} · {fmtT(v.duration)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={S.section}>本次训练强度 (RPE)</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[3, 5, 7, 9].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setRpe(n)}
                style={[S.rpeBtn, rpe === n && { backgroundColor: '#FF5A5F' }]}
              >
                <Text style={{ fontWeight: '800', color: rpe === n ? '#fff' : '#1A1A1A' }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[S.btnPrimary, { marginTop: 28, paddingVertical: 18 }, day.completed && { backgroundColor: '#2FBF71' }]}
            onPress={() => day.completed ? onBack() : onComplete(rpe)}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {day.completed ? '已完成' : '完成打卡'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressTab({ logs }) {
  const totalMin = Math.round(logs.reduce((s, l) => s + l.durationSec, 0) / 60);
  const avgRpe = logs.length ? (logs.reduce((s, l) => s + l.rpe, 0) / logs.length).toFixed(1) : '-';

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 16 }}>进度</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={S.statBox}>
          <Text style={{ color: '#7A7F87', fontSize: 12 }}>累计训练</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 6 }}>{logs.length}</Text>
          <Text style={{ color: '#7A7F87', fontSize: 11 }}>次</Text>
        </View>
        <View style={S.statBox}>
          <Text style={{ color: '#7A7F87', fontSize: 12 }}>总时长</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 6 }}>{totalMin}</Text>
          <Text style={{ color: '#7A7F87', fontSize: 11 }}>分钟</Text>
        </View>
        <View style={S.statBox}>
          <Text style={{ color: '#7A7F87', fontSize: 12 }}>平均 RPE</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 6 }}>{avgRpe}</Text>
        </View>
      </View>

      <Text style={S.section}>训练历史</Text>
      {logs.length === 0 ? (
        <View style={S.card}>
          <Text style={{ color: '#7A7F87' }}>还没有记录，去完成第一次吧</Text>
        </View>
      ) : (
        [...logs].reverse().map((l) => (
          <View key={l.id} style={S.logItem}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{l.theme}</Text>
              <Text style={{ color: '#7A7F87', fontSize: 12, marginTop: 4 }}>
                {l.date} · {Math.round(l.durationSec / 60)} 分钟 · RPE {l.rpe}
              </Text>
            </View>
            <Text style={{ color: '#2FBF71', fontWeight: '800' }}>OK</Text>
          </View>
        ))
      )}
    </View>
  );
}

function MeTab({ profile, prefs, onReset }) {
  const Row = ({ label, value }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ECEEF1' }}>
      <Text style={{ color: '#7A7F87', fontSize: 14 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 16 }}>我的</Text>
      <View style={S.card}>
        <Text style={{ fontSize: 15, fontWeight: '800', marginBottom: 12 }}>身体数据</Text>
        <Row label="性别" value={profile.gender === 'male' ? '男' : '女'} />
        <Row label="年龄" value={`${profile.age} 岁`} />
        <Row label="身高" value={`${profile.heightCm} cm`} />
        <Row label="体重" value={`${profile.weightKg} kg`} />
      </View>
      <View style={S.card}>
        <Text style={{ fontSize: 15, fontWeight: '800', marginBottom: 12 }}>训练偏好</Text>
        <Row label="每周频率" value={`${prefs.weeklyFrequency} 次`} />
        <Row label="单次时长" value={`${prefs.sessionMinutes} 分钟`} />
        <Row label="偏好类型" value={prefs.preferredTypes.join('、') || '-'} />
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#FFF2F2', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
        onPress={onReset}
      >
        <Text style={{ color: '#E5484D', fontWeight: '800' }}>重置所有数据</Text>
      </TouchableOpacity>
      <Text style={{ color: '#7A7F87', fontSize: 12, lineHeight: 19, marginTop: 16 }}>
        本应用提供的是通用健身建议，不能替代医生、康复师或营养师。如有慢病、孕期、术后恢复或运动损伤，请先咨询专业人士。
      </Text>
    </View>
  );
}

function TabBar({ tab, setTab }) {
  const items = [['home', '首页', 'H'], ['plan', '计划', 'P'], ['progress', '进度', 'G'], ['me', '我的', 'M']];
  return (
    <View style={S.tabBar}>
      {items.map(([k, label, icon]) => (
        <TouchableOpacity key={k} style={S.tabItem} onPress={() => setTab(k)}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: tab === k ? '#FF5A5F' : '#7A7F87' }}>{icon}</Text>
          <Text style={{ fontSize: 11, color: tab === k ? '#FF5A5F' : '#7A7F87', marginTop: 2, fontWeight: '600' }}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#FF5A5F', alignItems: 'center', justifyContent: 'center' },
  splashText: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: 1 },
  prog: { height: 6, borderRadius: 3, backgroundColor: '#ECEEF1', overflow: 'hidden', marginTop: 8 },
  progFill: { height: 6, backgroundColor: '#FF5A5F', borderRadius: 3 },
  h1: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', marginTop: 20 },
  sub: { color: '#7A7F87', marginTop: 6, marginBottom: 20, fontSize: 14 },
  label: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginTop: 18, marginBottom: 10 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1A1A1A' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ECEEF1', marginBottom: 4, marginRight: 8 },
  chipActive: { backgroundColor: '#FFEBEC', borderColor: '#FF5A5F' },
  chipText: { color: '#1A1A1A', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FF5A5F' },
  notice: { backgroundColor: '#FFF7E6', borderRadius: 12, padding: 14, marginTop: 24, borderLeftWidth: 4, borderLeftColor: '#F5A623' },
  btnPrimary: { flex: 1, backgroundColor: '#FF5A5F', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnGhost: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14, backgroundColor: '#fff', justifyContent: 'center' },
  hero: { backgroundColor: '#FF5A5F', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 34, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 18, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  section: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginTop: 26, marginBottom: 12, marginHorizontal: 20 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  dayCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  roleTag: { backgroundColor: '#F0F1F4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 62, alignItems: 'center' },
  rpeBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center' },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ECEEF1', paddingBottom: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
});
