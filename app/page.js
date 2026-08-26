"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sbcgcxljgceziohhytuw.supabase.co";
const supabaseKey = "sb_publishable_CSFpH1N5_WVloTnvNhArPQ_9Kh-JCuj";

const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [records, setRecords] = useState({});
  const [savingDay, setSavingDay] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const { data: taskData, error: taskError } = await supabase
      .from("learning_tasks")
      .select("*")
      .order("day");

    if (taskError) {
      console.error("读取学习计划失败:", taskError);
      alert("读取学习计划失败：" + taskError.message);
      setLoading(false);
      return;
    }

    const { data: recordData, error: recordError } = await supabase
      .from("learning_records")
      .select("*")
      .order("day");

    if (recordError) {
      console.error("读取学习记录失败:", recordError);
      alert("读取学习记录失败：" + recordError.message);
      setLoading(false);
      return;
    }

    const recordMap = {};

    (recordData || []).forEach((item) => {
      recordMap[item.day] = item;
    });

    setTasks(taskData || []);
    setRecords(recordMap);
    setLoading(false);
  }

  useEffect(() => {
  loadData();

  const channel = supabase
    .channel("learning_records_changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "learning_records",
      },
      () => {
        loadData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  async function saveRecord(day, status, note) {
    setSavingDay(day);

    const { data, error } = await supabase
      .from("learning_records")
      .upsert(
        {
          day: day,
          status: status,
          learning_note: note || "",
          result_note: "",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "day",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("保存失败:", error);
      alert("保存失败：" + error.message);
      setSavingDay(null);
      return;
    }

    setRecords((old) => ({
      ...old,
      [day]: data,
    }));

    setSavingDay(null);
  }

  function updateNote(day, note) {
    setRecords((old) => ({
      ...old,
      [day]: {
        ...(old[day] || {}),
        day: day,
        status: old[day]?.status || "in_progress",
        learning_note: note,
      },
    }));
  }

  const completedCount = Object.values(records).filter(
    (item) => item.status === "completed" || item.status === "已完成"
  ).length;

  const nextDay = Math.min(completedCount + 1, 180);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        正在加载 Ai180……
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "30px 20px 60px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
        background: "#f7f8fa",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>
        Ai180 AI职业转型学习计划
      </h1>

      <p style={{ color: "#666", marginBottom: "25px" }}>
        我的180天学习计划
      </p >

      {/* 当前进度 */}
      <div
        style={{
          background: "#111827",
          color: "white",
          padding: "20px",
          borderRadius: "14px",
          marginBottom: "25px",
        }}
      >
        <div style={{ fontSize: "14px", opacity: 0.7 }}>
          当前进度
        </div>

        <div
          style={{
            fontSize: "30px",
            fontWeight: "700",
            marginTop: "5px",
          }}
        >
          {completedCount} / 180 天
        </div>

        <div style={{ marginTop: "8px", opacity: 0.8 }}>
          下一步：Day {nextDay}
        </div>
      </div>

      {/* 学习任务 */}
      {tasks.map((task) => {
        const record = records[task.day] || {};

        const completed =
          record.status === "completed" ||
          record.status === "已完成";

        return (
          <div
            key={task.day}
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "16px",
              border: completed
                ? "2px solid #22c55e"
                : "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            {/* 标题 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "5px",
                  }}
                >
                  Day {task.day}
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  {task.title}
                </h2>
              </div>

              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: completed ? "#16a34a" : "#999",
                  whiteSpace: "nowrap",
                }}
              >
                {completed ? "✓ 已完成" : "未完成"}
              </div>
            </div>

            {/* 学习内容 */}
            <div
              style={{
                marginTop: "15px",
                lineHeight: 1.7,
                color: "#444",
              }}
            >
              {task.learn_content || "暂无学习内容"}
            </div>

            {/* 学习笔记 */}
            <textarea
              value={record.learning_note || ""}
              onChange={(e) =>
                updateNote(task.day, e.target.value)
              }
              placeholder="记录今天的学习心得、问题、收获……"
              style={{
                width: "100%",
                minHeight: "90px",
                marginTop: "18px",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #ddd",
                resize: "vertical",
                boxSizing: "border-box",
                fontSize: "14px",
              }}
            />

            {/* 操作按钮 */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={() =>
                  saveRecord(
                    task.day,
                    completed ? "in_progress" : "completed",
                    record.learning_note || ""
                  )
                }
                disabled={savingDay === task.day}
                style={{
                  padding: "10px 18px",
                  borderRadius: "9px",
                  border: "none",
                  background: completed ? "#6b7280" : "#111827",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {savingDay === task.day
                  ? "保存中..."
                  : completed
                  ? "取消完成"
                  : "完成今日学习"}
              </button>

              <button
                onClick={() =>
                  saveRecord(
                    task.day,
                    record.status || "in_progress",
                    record.learning_note || ""
                  )
                }
                disabled={savingDay === task.day}
                style={{
                  padding: "10px 18px",
                  borderRadius: "9px",
                  border: "1px solid #ddd",
                  background: "white",
                  color: "#333",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                保存笔记
              </button>
            </div>
          </div>
        );
      })}
    </main>
  );
}
