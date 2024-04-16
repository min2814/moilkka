//CreateEvent.js

import React from "react";
import "./App.css";
import { ConfigProvider, DatePicker, TimePicker, Button, Form, Input } from "antd";
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // UUID 라이브러리에서 v4 함수를 가져옴
import koKR from 'antd/lib/locale/ko_KR';
import 'dayjs/locale/ko';
import dayjs from 'dayjs';
import CommonHeaderAndSidebar from './Components/CommonHeaderAndSidebar';

dayjs.locale('ko');


class CreateEvent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      eventName: "",
      startTime: null,
      endTime: null,
      selectedDates: [],
    };
    this.handleStartTimeChange = this.handleStartTimeChange.bind(this);
    this.handleEndTimeChange = this.handleEndTimeChange.bind(this);
    this.handleEventNameChange = this.handleEventNameChange.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
  }

  handleStartTimeChange(time) {
    this.setState({ startTime: time });
  }

  handleEndTimeChange(time) {
    this.setState({ endTime: time });
  }

  handleEventNameChange(event) {
    this.setState({ eventName: event.target.value });
  }

  handleConfirm() {
    const { startTime, endTime, selectedDates, eventName } = this.state;

    // 최소한 두 개 이상의 날짜가 선택되었는지 확인
    if (selectedDates.length < 2) {
      console.error("At least two dates should be selected");
      return;
    }

    // 첫 번째와 두 번째 날짜 선택
    const startDay = selectedDates[0];
    const endDay = selectedDates[1];

    // 시작 및 종료 시간 문자열 생성
    const startTimeStr = startTime.format("HH:mm");
    const endTimeStr = endTime.format("HH:mm");

    // 8자리 UUID 생성
    const eventUUID = uuidv4().substring(0, 8);

    // 클라이언트의 시간대로 변환하여 서버로 전송
    const startDayLocal = startDay.format("YYYY-MM-DD");
    const endDayLocal = endDay.format("YYYY-MM-DD");

    // 시작일과 종료일을 서버로 전송
    axios
      .post("/api/events", {
        uuid: eventUUID,
        eventName: eventName,
        startDay: startDayLocal,
        endDay: endDayLocal,
        startTime: startTimeStr,
        endTime: endTimeStr,
      })
      .then((response) => {
        console.log("Data sent successfully:", response.data);
        window.location.href = `http://localhost:8080/test/?key=${eventUUID}`;
      })
      .catch((error) => {
        console.error("Error sending data:", error);
      });

    console.log("Event UUID:", eventUUID);
    console.log("Event Name:", eventName);
    console.log("Start Day:", startDay);
    console.log("End Day:", endDay);
    console.log("Selected Start Time:", startTimeStr);
    console.log("Selected End Time:", endTimeStr);
  }
  
 

  render() {
    return (
      
      <div className="App">
        <CommonHeaderAndSidebar />
        <main className="main-content">
          <h1>Availability Selector</h1>
          <Form.Item
            label="이벤트 이름"
            name="eventName"
            rules={[{ required: true, message: "이벤트 이름을 입력해주세요" }]}
          >
            <Input onChange={this.handleEventNameChange} />
          </Form.Item>
          <div className="date-time-picker">
          <ConfigProvider locale={koKR}>

            <DatePicker.RangePicker
              //locale={koKR}
              format="YYYY년 MM월 DD일"
              onChange={(dates) => {
                this.setState({ selectedDates: dates });
              }}
              placeholder={['시작 날짜', '종료 날짜']} // placeholder 변경
              // renderExtraFooter={() => (
              //   <span>일</span>
              // )}
            />

            <TimePicker
              //locale={ko}
              format="HH시 mm분"
              onChange={this.handleStartTimeChange}
              placeholder="시작 시간"
              minuteStep={60} // 분 단위 30분 간격으로 변경
               // 한국어 로케일 적용
            />
            <TimePicker
              //locale={ko}
              format="HH시 mm분"
              onChange={this.handleEndTimeChange}
              placeholder="종료 시간"
              minuteStep={60} // 분 단위 30분 간격으로 변경
               // 한국어 로케일 적용
            />
            </ConfigProvider>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                onClick={this.handleConfirm}
                disabled={
                  !this.state.selectedDates.length ||
                  !this.state.startTime ||
                  !this.state.endTime ||
                  !this.state.eventName
                }
              >
                확인
              </Button>
            </Form.Item>
          </div>
        </main>
 

        <footer className="footer">
          <p>© 2024 모일까. All rights reserved.</p>
        </footer>
      </div>
    );
  }
}

export default CreateEvent;