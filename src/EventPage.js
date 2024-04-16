//EventPage.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Button } from "antd";
import ScheduleSelector from "react-schedule-selector";
import CommonHeaderAndSidebar from './Components/CommonHeaderAndSidebar';

function EventPage() {
  const [eventData, setEventData] = useState(null);
  const [selectedTime, setSelectedTime] = useState([]); // 선택된 시간을 배열로 관리합니다.
  const [schedule, setSchedule] = useState([]);
  const [numDays, setNumDays] = useState(1); 

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const uuid = urlParams.get("key");

    axios
      .get(`/api/events/${uuid}`)
      .then((response) => {
        setEventData(response.data);
        const startDate = moment(response.data.day);
        const endDate = moment(response.data.time);
        const diffDays = endDate.diff(startDate, "days") + 1;
        setNumDays(diffDays);
      })
      .catch((error) => {
        console.error("Error fetching event data:", error);
      });
  }, []);

  const handleConfirm = () => {
    // 선택된 시간을 서버로 보내어 데이터베이스에 저장합니다.
    Object.entries(selectedTime).forEach(([date, times]) => {
      times.forEach((time) => {
        const datetime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm").format();
        const requestData = {
          user_id: 1, // 예시로 사용자 ID를 1로 지정합니다. 실제로는 사용자의 ID를 지정해야 합니다.
          event_name: eventData.eventname,
          event_uuid: eventData.uuid,
          event_datetime: datetime
        };
        axios.post("/api/save-event-schedule", requestData)
          .then((response) => {
            console.log("Event schedule saved successfully:", response.data);
          })
          .catch((error) => {
            console.error("Error saving event schedule:", error);
          });
      });
    });
  };

  const handleScheduleChange = (newSchedule) => {
    setSchedule(newSchedule);
    // 선택된 시간을 각 날짜별로 묶어서 저장합니다.
    const selectedTimeByDate = {};
    newSchedule.forEach((time) => {
      const date = moment(time).format("YYYY-MM-DD");
      if (!selectedTimeByDate[date]) {
        selectedTimeByDate[date] = [];
      }
      selectedTimeByDate[date].push(moment(time).format("HH:mm"));
    });
    setSelectedTime(selectedTimeByDate);
  };

  if (!eventData) {
    return <p>Loading...</p>;
  }

  const startDate = moment(eventData.day).format("YYYY-MM-DD");
  const endDate = moment(eventData.time).format("YYYY-MM-DD");
  const startTime = moment(eventData.day).format("HH:mm");
  const endTime = moment(eventData.time).format("HH:mm");
  const Schedule_Start = moment(eventData.day).toDate();
  const Schedule_End = moment(eventData.time).toDate();

  return (
    <div className="App">
      
      <CommonHeaderAndSidebar />
      <main className="main-content">




        
        <h1>Event Details</h1>
        <h2>Event Name: {eventData.eventname}</h2>
        <h2>Event UUID: {eventData.uuid}</h2>
        <p>Start Day: {startDate}</p>
        <p>End Day: {endDate}</p>
        <p>Start Time: {startTime}</p>
        <p>End Time: {endTime}</p>
        <ScheduleSelector
          selection={schedule}
          numDays={numDays}
          startDate={Schedule_Start}
          endDate={Schedule_End}
          minTime={moment(startTime, "HH:mm").hours()}
          maxTime={moment(endTime, "HH:mm").hours()}
          hourlyChunks={2}
          rowGap="0px"
          onChange={handleScheduleChange}
          renderTimeLabel={(time) => {
            const formattedStartTime = moment(time).format("HH:mm");
            const formattedEndTime = moment(time).add(30, "minutes").format("HH:mm");
            return <div>{formattedStartTime} - {formattedEndTime}</div>;
          }}
        />
        <Button type="primary" onClick={handleConfirm}>
          Confirm
        </Button>
        {/* 선택된 시간을 날짜와 시간으로 표시합니다. */}
        {Object.entries(selectedTime).map(([date, times]) => (
          <div key={date}>
            {times.map((time) => (
              <p key={time}>{date} {time}</p>
            ))}
          </div>
        ))}
      </main>

      <footer className="footer">
        <p>© 2024 모일까. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default EventPage;