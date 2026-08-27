"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";


const supabaseUrl =
  "https://sbcgcxljgceziohhytuw.supabase.co";


const supabaseKey =
  "sb_publishable_CSFpH1N5_WVloTnvNhArPQ_9Kh-JCuj";


const supabase = createClient(
  supabaseUrl,
  supabaseKey
);



export default function Home() {


  const [tasks, setTasks] = useState([]);

  const [records, setRecords] = useState({});

  const [savingDay, setSavingDay] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showHistory, setShowHistory] = useState(false);


  // =====================
  // AI 自动总结
  // =====================

  const [aiSummary, setAiSummary] = useState("");

  const [aiLoading, setAiLoading] = useState(false);


  // =====================
  // AI 成长报告
  // =====================

  const [growthReport, setGrowthReport] =
    useState("");

  const [reportLoading, setReportLoading] =
    useState(false);



  // =====================
  // 获取数据
  // =====================

  async function loadData() {


    const {
      data: taskData,
      error: taskError
    } = await supabase
      .from("learning_tasks")
      .select("*")
      .order("day");


    if (taskError) {

      console.error(
        "读取学习计划失败:",
        taskError
      );

      return;

    }



    const {
      data: recordData,
      error: recordError
    } = await supabase
      .from("learning_records")
      .select("*")
      .order("day");


    if (recordError) {

      console.error(
        "读取学习记录失败:",
        recordError
      );

      return;

    }



    const map = {};


    (recordData || []).forEach(
      item => {

        map[item.day] = item;

      }
    );



    setTasks(
      taskData || []
    );


    setRecords(
      map
    );


    setLoading(
      false
    );

  }



  // =====================
  // 初始化 + 实时同步
  // =====================

  useEffect(() => {


    loadData();


    const channel =
      supabase
        .channel(
          "learning_records_changes"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "learning_records"
          },
          () => {

            loadData();

          }
        )
        .subscribe();


    return () => {

      supabase.removeChannel(
        channel
      );

    };


  }, []);



  // =====================
  // 统计
  // =====================

  const completedCount =
    Object.values(records)
      .filter(
        item =>
          item.status === "completed"
      )
      .length;


  const progressPercent =
    Math.round(
      completedCount /
      180 *
      100
    );


  const remainingDays =
    180 -
    completedCount;


  const aiSummaryCount =
    Object.values(records)
      .filter(
        item =>
          item.ai_summary
      )
      .length;


  const resultCount =
    Object.values(records)
      .filter(
        item =>
          item.result_note
      )
      .length;


  const phaseList =
    [
      ...new Set(
        tasks.map(
          item =>
            item.phase
        )
      )
    ];



  const nextDay =
    Math.min(
      completedCount + 1,
      180
    );



  const todayTask =
    tasks.find(
      task =>
        task.day === nextDay
    )
    ||
    tasks[0];



  const currentPhase =
    todayTask?.phase ||
    "AI能力建立";



  // =====================
  // 同步今日 AI 总结
  // =====================

  useEffect(() => {


    if (todayTask) {

      setAiSummary(
        records[
          todayTask.day
        ]?.ai_summary
        ||
        ""
      );

    }

  }, [
    todayTask,
    records
  ]);



  // =====================
  // 保存记录
  // =====================

  async function saveRecord(
    day,
    status,
    learning_note,
    result_note
  ) {


    setSavingDay(
      day
    );


    const {
      data,
      error
    } =
      await supabase
        .from(
          "learning_records"
        )
        .upsert(
          {

            day:
              day,

            status:
              status,

            learning_note:
              learning_note || "",

            result_note:
              result_note || "",

            updated_at:
              new Date()
                .toISOString()

          },
          {

            onConflict:
              "day"

          }
        )
        .select()
        .single();



    if (error) {

      console.error(
        "保存失败:",
        error
      );


      alert(
        "保存失败：" +
        error.message
      );


      setSavingDay(
        null
      );


      return;

    }



    setRecords(
      old => ({

        ...old,

        [day]:
          data

      })
    );


    setSavingDay(
      null
    );

  }
    // =====================
  // 更新学习心得输入
  // =====================

  function updateNote(
    day,
    value
  ){

    setRecords(
      old => ({

        ...old,

        [day]:{

          ...(old[day] || {}),

          day:
            day,

          status:
            old[day]?.status ||
            "in_progress",

          learning_note:
            value

        }

      })
    );

  }




  // =====================
  // AI自动总结
  // =====================


  async function generateAISummary(){


    if(!todayTask){

      return;

    }


    const record =
      records[todayTask.day]
      ||
      {};


    const learningNote =
      record.learning_note
      ||
      "";


    const resultNote =
      record.result_note
      ||
      "";



    if(
      !learningNote &&
      !resultNote
    ){

      alert(
        "请先填写学习心得或成果输出"
      );

      return;

    }



    setAiLoading(
      true
    );



    try{


      const response =
        await fetch(
          "/api/ai-summary",
          {

            method:
              "POST",

            headers:{

              "Content-Type":
                "application/json"

            },


            body:
              JSON.stringify({

                learning_note:
                  learningNote,

                result_note:
                  resultNote

              })

          }

        );



      const data =
        await response.json();



      if(!response.ok){

        throw new Error(
          data.error ||
          "AI总结失败"
        );

      }



      setAiSummary(
        data.summary ||
        ""
      );



      await supabase
        .from(
          "learning_records"
        )
        .upsert(
          {

            day:
              todayTask.day,


            learning_note:
              learningNote,


            result_note:
              resultNote,


            ai_summary:
              data.summary ||
              "",


            updated_at:
              new Date()
              .toISOString()

          },
          {

            onConflict:
              "day"

          }

        );



    }catch(error){


      alert(
        "AI总结失败：" +
        error.message
      );


    }finally{


      setAiLoading(
        false
      );


    }


  }





  // =====================
  // AI成长报告
  // =====================


  async function generateGrowthReport(){


    setReportLoading(
      true
    );


    try{


      const response =
await fetch(
"/api/growth-report",
{
method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

tasks:tasks,

records:records

})

}
);
          {

            method:
              "POST"

          }

        );


      const data =
        await response.json();



      if(!response.ok){


        throw new Error(
          data.error ||
          "生成失败"
        );

      }



      setGrowthReport(
        data.report ||
        ""
      );



    }catch(error){


      alert(
        "生成失败：" +
        error.message
      );


    }finally{


      setReportLoading(
        false
      );


    }


  }
    if(loading){

    return (

      <div
        style={{
          padding:"50px",
          textAlign:"center"
        }}
      >
        Ai180加载中...
      </div>

    );

  }



  return (

    <main

      style={{

        maxWidth:"900px",

        margin:"0 auto",

        padding:"25px 18px 60px",

        background:"#f7f8fa",

        minHeight:"100vh",

        fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Arial'

      }}

    >



      <h1>
        Ai180 AI职业转型计划
      </h1>


      <p
        style={{
          color:"#666"
        }}
      >
        我的180天AI能力成长路线
      </p >





      {/* 成长看板 */}

      <div

        style={{

          display:"grid",

          gridTemplateColumns:
          "repeat(2,1fr)",

          gap:"12px",

          marginTop:"20px"

        }}

      >



        <div
          style={{
            background:"#111827",
            color:"white",
            padding:"18px",
            borderRadius:"16px"
          }}
        >

          🔥 连续学习

          <div
            style={{
              fontSize:"28px",
              fontWeight:"700"
            }}
          >

            {completedCount}天

          </div>


        </div>





        <div
          style={{
            background:"white",
            padding:"18px",
            borderRadius:"16px"
          }}
        >

          🤖 AI总结

          <div
            style={{
              fontSize:"28px",
              fontWeight:"700"
            }}
          >

            {aiSummaryCount}篇

          </div>


        </div>





        <div
          style={{
            background:"white",
            padding:"18px",
            borderRadius:"16px"
          }}
        >

          🚀 成果输出

          <div
            style={{
              fontSize:"28px",
              fontWeight:"700"
            }}
          >

            {resultCount}项

          </div>


        </div>





        <div
          style={{
            background:"white",
            padding:"18px",
            borderRadius:"16px"
          }}
        >

          📚 完成进度

          <div
            style={{
              fontSize:"28px",
              fontWeight:"700"
            }}
          >

            {completedCount}/180

          </div>


        </div>




      </div>





      {/* 今日任务 */}


      {
        todayTask &&


        <div

        style={{

          background:"white",

          marginTop:"22px",

          padding:"22px",

          borderRadius:"16px",

          border:"2px solid #111827"

        }}

        >



        <div
          style={{
            color:"#666"
          }}
        >
          今日学习
        </div>



        <h2>
          Day {todayTask.day}
        </h2>



        <div>

          阶段：

          {todayTask.phase}

        </div>



        <h3>

          {todayTask.title}

        </h3>




        <p>

          {todayTask.learn_content}

        </p >





        <h4>
          今日行动
        </h4>


        <p>

          {
            todayTask.action_content ||
            "完成今日任务"
          }

        </p >
        <textarea

          value={
            records[todayTask.day]
            ?.learning_note
            ||
            ""
          }


          onChange={
            (e)=>
            updateNote(
              todayTask.day,
              e.target.value
            )
          }


          placeholder="记录今天的学习心得、问题、收获..."


          style={{

            width:"100%",

            minHeight:"110px",

            marginTop:"15px",

            padding:"12px",

            borderRadius:"10px",

            border:"1px solid #ddd",

            boxSizing:"border-box"

          }}

        />





        <textarea

          value={
            records[todayTask.day]
            ?.result_note
            ||
            ""
          }


          onChange={
            (e)=>
            setRecords(
              old=>({

                ...old,


                [todayTask.day]:{

                  ...(old[todayTask.day] || {}),


                  day:
                  todayTask.day,


                  status:
                  old[todayTask.day]?.status
                  ||
                  "in_progress",


                  result_note:
                  e.target.value

                }

              })
            )
          }


          placeholder="记录今天的成果输出，例如作品、代码、总结..."


          style={{

            width:"100%",

            minHeight:"100px",

            marginTop:"12px",

            padding:"12px",

            borderRadius:"10px",

            border:"1px solid #ddd",

            boxSizing:"border-box"

          }}

        />





        <button


          onClick={()=>{


            const status =
            records[todayTask.day]
            ?.status;



            saveRecord(

              todayTask.day,


              status==="completed"

              ?

              "in_progress"

              :

              "completed",


              records[todayTask.day]
              ?.learning_note
              ||
              "",


              records[todayTask.day]
              ?.result_note
              ||
              ""

            );


          }}



          style={{

            marginTop:"15px",

            width:"100%",

            padding:"12px",

            borderRadius:"10px",

            border:"none",

            background:"#111827",

            color:"white"

          }}

        >

          {
          records[todayTask.day]
          ?.status==="completed"

          ?

          "取消完成"

          :

          "完成今日学习"

          }


        </button>





        <button


          onClick={
            generateAISummary
          }


          disabled={
            aiLoading
          }


          style={{

            marginTop:"12px",

            width:"100%",

            padding:"12px",

            borderRadius:"10px",

            border:"1px solid #111827",

            background:"white"

          }}

        >

        {

        aiLoading

        ?

        "🤖 AI正在总结..."

        :

        "🤖 AI自动总结"

        }


        </button>





        {
        aiSummary &&


        <div

        style={{

          marginTop:"15px",

          background:"#f3f4f6",

          padding:"15px",

          borderRadius:"12px"

        }}

        >

          <h4>
          AI学习总结
          </h4>


          {aiSummary}


        </div>

        }



        </div>

      }





      {/* AI成长报告 */}

      <div

      style={{

        background:"white",

        marginTop:"20px",

        padding:"20px",

        borderRadius:"16px"

      }}

      >

      <h3>
      📄 AI成长报告
      </h3>


      <p>

      生成你的180天AI能力成长总结，
      用于作品展示和职业转型规划。

      </p >



      <button

      onClick={
        generateGrowthReport
      }


      disabled={
        reportLoading
      }


      style={{

        width:"100%",

        padding:"12px",

        borderRadius:"10px",

        background:"#111827",

        color:"white",

        border:"none"

      }}

      >

      {

      reportLoading

      ?

      "🤖 正在生成..."

      :

      "📄 生成我的AI成长报告"

      }


      </button>



      {
      growthReport &&


      <div

      style={{

        marginTop:"15px",

        background:"#f3f4f6",

        padding:"15px",

        borderRadius:"12px",

        lineHeight:"1.7"

      }}

      >

      <h4>
      我的AI成长报告
      </h4>


      {growthReport}


      </div>

      }


      </div>





      {/* 历史记录 */}


      <button

      onClick={()=>{

        setShowHistory(
          !showHistory
        )

      }}


      style={{

        width:"100%",

        marginTop:"25px",

        padding:"15px",

        borderRadius:"12px",

        background:"white",

        border:"1px solid #ddd"

      }}

      >

      {

      showHistory

      ?

      "收起历史学习记录 ▲"

      :

      "查看历史学习记录 ▼"

      }


      </button>





      {
      showHistory &&


      tasks.map(

      task=>(

      <div

      key={
        task.day
      }


      style={{

        background:"white",

        marginTop:"12px",

        padding:"15px",

        borderRadius:"12px"

      }}

      >

      <h3>

      Day {task.day}

      {" · "}

      {task.title}


      </h3>


      <div>

      阶段：

      {task.phase}

      </div>


      <p>

      学习心得：

      <br/>

      {
      records[task.day]
      ?.learning_note
      ||
      "暂无记录"
      }


      </p >


      <p>

      成果输出：

      <br/>

      {
      records[task.day]
      ?.result_note
      ||
      "暂无记录"
      }


      </p >


      <div

      style={{

        background:"#f3f4f6",

        padding:"10px",

        borderRadius:"10px"

      }}

      >

      AI总结：

      <br/>

      {
      records[task.day]
      ?.ai_summary
      ||
      "暂无AI总结"
      }


      </div>


      </div>

      )

      )

      }



    </main>

  );


}
