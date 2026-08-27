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
  // 获取数据
  // =====================


  async function loadData(){


    const {
      data: taskData,
      error: taskError
    } = await supabase
      .from("learning_tasks")
      .select("*")
      .order("day");


    if(taskError){

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



    if(recordError){

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


    setRecords(map);


    setLoading(false);


  }





  // =====================
  // 初始化 + 实时同步
  // =====================


  useEffect(()=>{


    loadData();



    const channel =
      supabase
      .channel(
        "learning_records_changes"
      )
      .on(
        "postgres_changes",
        {
          event:"*",
          schema:"public",
          table:"learning_records"
        },
        ()=>{
          loadData();
        }
      )
      .subscribe();



    return ()=>{

      supabase.removeChannel(
        channel
      );

    };


  },[]);






  // =====================
  // 保存记录
  // =====================


  async function saveRecord(
  day,
  status,
  learning_note,
  result_note
){


    setSavingDay(day);



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

        day:day,

        status:status,

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




    if(error){


      console.error(
        "保存失败:",
        error
      );


      alert(
        "保存失败：" +
        error.message
      );


      setSavingDay(null);


      return;

    }




    setRecords(
      old=>({

        ...old,

        [day]:data

      })
    );



    setSavingDay(null);



  }





  function updateNote(
    day,
    value
  ){


    setRecords(
      old=>({

        ...old,


        [day]:{

          ...(old[day] || {}),

          day:day,

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
  180 - completedCount;






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

  }  return (

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


      <h1
        style={{
          marginBottom:"5px"
        }}
      >
        Ai180 AI职业转型计划
      </h1>


      <p
        style={{
          color:"#666"
        }}
      >
        我的180天AI能力成长路线
      </p >




      {/* 数据面板 */}

{/* Dashboard */}
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

<div
style={{
opacity:.7,
fontSize:"13px"
}}
>
🔥 连续学习
</div>


<div
style={{
fontSize:"28px",
fontWeight:"700"
}}
>
{completedCount}
天
</div>

</div>





<div
style={{
background:"white",
padding:"18px",
borderRadius:"16px"
}}
>

<div
style={{
color:"#666",
fontSize:"13px"
}}
>
📚 完成进度
</div>


<div
style={{
fontSize:"28px",
fontWeight:"700"
}}
>
{completedCount}/180
</div>

</div>





<div
style={{
background:"white",
padding:"18px",
borderRadius:"16px"
}}
>

<div
style={{
color:"#666",
fontSize:"13px"
}}
>
📈 完成率
</div>


<div
style={{
fontSize:"28px",
fontWeight:"700"
}}
>
{progressPercent}%
</div>

</div>





<div
style={{
background:"white",
padding:"18px",
borderRadius:"16px"
}}
>

<div
style={{
color:"#666",
fontSize:"13px"
}}
>
⏳ 剩余
</div>


<div
style={{
fontSize:"28px",
fontWeight:"700"
}}
>
{remainingDays}
天
</div>

</div>


</div>



        <div
          style={{
            fontSize:"34px",
            fontWeight:"700",
            marginTop:"8px"
          }}
        >

          {completedCount}

          /

          180 天

        </div>



        <div
          style={{
            marginTop:"8px",
            opacity:.85
          }}
        >

          完成率：
          {progressPercent}%

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
              color:"#666",
              fontSize:"14px"
            }}
          >
            今日学习
          </div>




          <h2>
            Day {todayTask.day}
          </h2>




          <div
            style={{
              color:"#666",
              marginBottom:"10px"
            }}
          >

            阶段：

            {todayTask.phase || "AI学习"}

          </div>




          <h3>

            {todayTask.title}

          </h3>

            <div
style={{
background:"#f3f4f6",
padding:"10px",
borderRadius:"10px",
marginBottom:"12px"
}}
>
当前阶段：
{currentPhase}
</div>



          <p
            style={{
              lineHeight:"1.7",
              color:"#444"
            }}
          >

            {todayTask.learn_content}

          </p >





          <h4>
            今日行动
          </h4>




          <p
            style={{
              lineHeight:"1.7",
              color:"#444"
            }}
          >

            {
              todayTask.action_content ||
              "完成今日学习任务"
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

              boxSizing:"border-box",

              fontSize:"14px"

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
...(old[todayTask.day]||{}),
day:todayTask.day,
status:
old[todayTask.day]?.status ||
"in_progress",
result_note:e.target.value
}
})
)
}

placeholder="记录今天的成果输出、作品、代码、总结..."

style={{

width:"100%",

minHeight:"90px",

marginTop:"12px",

padding:"12px",

borderRadius:"10px",

border:"1px solid #ddd",

boxSizing:"border-box"

}}

/>





          <button


            onClick={()=>{


              const currentStatus =
              records[todayTask.day]
              ?.status;



              saveRecord(

  todayTask.day,

  currentStatus === "completed"

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



            disabled={
              savingDay === todayTask.day
            }



            style={{

              marginTop:"15px",

              padding:"12px 25px",

              borderRadius:"10px",

              border:"none",

              background:"#111827",

              color:"white",

              fontSize:"15px",

              cursor:"pointer"

            }}


          >

          {
            savingDay === todayTask.day

            ?

            "保存中..."

            :

            records[todayTask.day]
            ?.status === "completed"

            ?

            "取消完成"

            :

            "完成今日学习"

          }


          </button>



        </div>

      }







      {/* 历史记录 */}

      <button


        onClick={()=>
          setShowHistory(
            !showHistory
          )
        }



        style={{

          width:"100%",

          marginTop:"25px",

          padding:"15px",

          background:"white",

          border:"1px solid #ddd",

          borderRadius:"12px",

          fontSize:"15px"

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

          task => (


            <div


              key={task.day}


              style={{

                background:"white",

                marginTop:"10px",

                padding:"15px",

                borderRadius:"12px",

                display:"flex",

                justifyContent:"space-between"

              }}


            >


              <span>

                Day {task.day}

                {" · "}

                {task.title}


              </span>




              <span>


              {

                records[task.day]
                ?.status === "completed"

                ?

                "✓"

                :

                ""

              }


              </span>


            </div>


          )


        )


      }





    </main>

  );

}
