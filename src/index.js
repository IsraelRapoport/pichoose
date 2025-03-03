// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// פונקציה שממירה תאריך לפורמט DD.MM.YYYY
const formatDate = (dateString) => {
  if (!dateString) return dateString;

  // בדיקה אם התאריך הוא בפורמט YYYY-MM-DD
  let date = dateString.match(/\d{4}-\d{2}-\d{2}/);
  if (!date) return dateString;

  let [year, month, day] = date[0].split('-');
  return `${day}.${month}.${year}`;
};

// פונקציה שמחפשת תאריכים ומשנה אותם
const updateDates = () => {
  document.querySelectorAll('*').forEach(el => {
    if (!el || !el.innerText || el.children.length > 0) return; // בדיקה למניעת שגיאות

    let newText = el.innerText.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (match) => formatDate(match));
    if (newText !== el.innerText) {
      el.innerText = newText;
    }
  });
};

// מאזין לשינויים בדף כדי לעדכן תאריכים אוטומטית
const observer = new MutationObserver(updateDates);
observer.observe(document.body, { childList: true, subtree: true });

// הפעלה ראשונית
document.addEventListener("DOMContentLoaded", updateDates);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
