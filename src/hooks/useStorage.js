import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// 初期入力データ生成
export function createInitialInputData() {
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const channels = ['instagram', 'x', 'threads', 'youtube'];
  const data = {};

  months.forEach(month => {
    data[month] = {};
    channels.forEach(ch => {
      data[month][ch] = { w1: 0, w2: 0, w3: 0, w4: 0 };
    });
  });

  return data;
}

export function createInitialLinePhases() {
  const phases = ['準備①', '準備②', '準備③', '準備④', '本配信①', '本配信②', '振り返り', '第2回準備', '第2回配信'];
  const data = {};
  phases.forEach(p => {
    data[p] = { done: false, memo: '', improvement: '' };
  });
  return data;
}

export function createInitialTaskData() {
  const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const channels = ['instagram', 'x', 'threads', 'youtube'];
  const data = {};
  months.forEach(month => {
    data[month] = {};
    channels.forEach(ch => {
      data[month][ch] = { w1: '', w2: '', w3: '', w4: '' };
    });
  });
  return data;
}
