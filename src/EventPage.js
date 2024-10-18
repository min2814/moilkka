import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Button, Card, Typography, Row, Col, message, Tooltip, TimePicker, Input, DatePicker, Modal } from "antd";
import { CalendarOutlined, ToolOutlined } from '@ant-design/icons'; // Import the calendar icon
import ScheduleSelector from "react-schedule-selector";
import { checkKakaoLoginStatus, getUserInfoFromLocalStorage, clearUserInfoFromLocalStorage } from './Components/authUtils';
import Socialkakao from "./Components/Socialkakao";
import KakaoShareButton from "./Components/KakaoShareButton";
import './App.css';

const { Title, Text } = Typography;

function EventPage() {
  const [eventData, setEventData] = useState(null);
  const [selectedTime, setSelectedTime] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [numDays, setNumDays] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allSchedules, setAllSchedules] = useState([]);
  const [userSchedules, setUserSchedules] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [userSelectedTimes, setUserSelectedTimes] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // 모달 상태 추가

  useEffect(() => {
    const checkLoginStatus = async () => {
      const savedAccessToken = localStorage.getItem('kakaoAccessToken');
      if (savedAccessToken) {
        const status = await checkKakaoLoginStatus(savedAccessToken);
        if (status) {
          const storedUserInfo = getUserInfoFromLocalStorage();
          if (storedUserInfo) {
            setUserInfo(storedUserInfo);
          }
        } else {
          clearUserInfoFromLocalStorage();
          setUserInfo(null);
        }
      }
    };

    checkLoginStatus();
  }, []);

  const fetchEventData = async () => {
    try {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const uuid = urlParams.get("key");

      const response = await axios.get(`/api/events/${uuid}`);
      setEventData(response.data);

      const startDate = moment(response.data.startday);
      const endDate = moment(response.data.endday);
      const diffDays = endDate.diff(startDate, "days") + 1;
      setNumDays(diffDays);

      const schedulesResponse = await axios.get(`/api/event-schedules/${uuid}`);
      setAllSchedules(schedulesResponse.data);

      const userSchedulesMap = {};
      schedulesResponse.data.forEach(schedule => {
        const time = moment(schedule.event_datetime).format("YYYY-MM-DD HH:mm");
        if (!userSchedulesMap[time]) {
          userSchedulesMap[time] = [];
        }
        userSchedulesMap[time].push(schedule.nickname);
      });
      setUserSchedules(userSchedulesMap);

      if (userInfo) {
        const userSchedule = schedulesResponse.data.filter(schedule => schedule.kakaoId === userInfo.id.toString() && schedule.event_uuid === uuid);

        const userSelectedTime = userSchedule.map(schedule => moment(schedule.event_datetime).toDate());
        setSchedule(userSelectedTime);
        setUserSelectedTimes(userSchedule.map(schedule => moment(schedule.event_datetime).format("YYYY-MM-DD HH:mm")));

        const selectedTimeByDate = {};
        userSelectedTime.forEach((time) => {
          const date = moment(time).format("YYYY-MM-DD");
          if (!selectedTimeByDate[date]) {
            selectedTimeByDate[date] = [];
          }
          selectedTimeByDate[date].push(moment(time).format("HH:mm"));
        });
        setSelectedTime(selectedTimeByDate);
      }

    } catch (error) {
      console.error("Error fetching event data:", error);
      message.error("Error fetching event data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [userInfo]);

  const handleConfirm = async () => {
    try {
      setConfirmLoading(true);

      await axios.delete("/api/delete-event-schedule", {
        data: {
          kakaoId: userInfo.id.toString(),
          event_uuid: eventData.uuid,
        },
      });

      for (const [date, times] of Object.entries(selectedTime)) {
        for (const time of times) {
          const datetime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm").format();

          const requestData = {
            kakaoId: userInfo.id.toString(),
            nickname: userInfo.kakao_account.profile.nickname,
            event_name: eventData.eventname,
            event_uuid: eventData.uuid,
            event_datetime: datetime,
          };

          await axios.post("/api/save-event-schedule", requestData);
        }
      }

      await fetchEventData(); // Fetch latest data

      message.success("일정이 즉시 적용되었습니다");
    } catch (error) {
      console.error("일정 저장 오류:", error);
      message.error("일정 저장 오류");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleScheduleChange = (newSchedule) => {
    setSchedule(newSchedule);
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

  const handleCopyLink = () => {
    const link = `http://localhost:8080/test/?key=${eventData.uuid}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        message.success('링크가 클립보드에 복사되었습니다!');
      })
      .catch(err => {
        message.error('링크 복사에 실패했습니다.');
        console.error('Error copying link:', err);
      });
  };
  const showModal = () => {
    setIsModalVisible(true); // 모달 열기
  };
  
  const handleOk = () => {
    setIsModalVisible(false); // 모달 닫기
  };
  
  const handleCancel = () => {
    setIsModalVisible(false); // 모달 닫기
  };
  

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!userInfo) {
    return <Socialkakao />;
  }

  if (!eventData) {
    return <p>No event data available</p>;
  }

  const startDate = moment(eventData.startday).format("YYYY-MM-DD");
  const endDate = moment(eventData.endday).format("YYYY-MM-DD");
  const startTime = moment(eventData.startday).format("HH:mm");
  const endTime = moment(eventData.endday).format("HH:mm");
  const Schedule_Start = moment(eventData.startday).toDate();
  const Schedule_End = moment(eventData.endday).toDate();

  const countOccurrences = (time) => {
    return allSchedules.filter(schedule => moment(schedule.event_datetime).isSame(time, 'minute')).length;
  };
  const mergeConsecutiveTimes = (times) => {
    if (!times || times.length === 0) return [];
  
    const mergedTimes = [];
    let start = times[0];
    let end = times[0];
  
    for (let i = 1; i < times.length; i++) {
      const currentTime = moment(times[i], "YYYY-MM-DD HH:mm");
      const previousTime = moment(end, "YYYY-MM-DD HH:mm");
  
      // Check if the current time is consecutive to the previous time (30-minute interval)
      if (currentTime.diff(previousTime, "minutes") === 30) {
        end = times[i];
      } else {
        // If not consecutive, push the current range and start a new range
        mergedTimes.push(`${start} ~ ${end}`);
        start = times[i];
        end = times[i];
      }
    }
  
    // Push the last range
    mergedTimes.push(`${start} ~ ${end}`);
    return mergedTimes;
  };
  const colors = ["blue", "red", "green", "purple", "orange", "pink"];
  const userColorMap = {};
  
  // 전체 스케줄 데이터에서 사용자 목록을 가져와 유니크하게 만듭니다.
  const allUsers = [...new Set(allSchedules.map(schedule => schedule.nickname))];

  // 사용자마다 색을 매핑합니다.
  allUsers.forEach((user, index) => {
    userColorMap[user] = colors[index % colors.length];
  });
  
  return (
    <div className="App">
      <main className="main-content">
            <Row gutter={[16, 16]} >
                {/* Row for Event Details and Event Management side by side */}
                <Col span={12}>
                  {/* Event Details Section */}
                  <Card style={{ margin: "20px", padding: "0px" }}>
                    <Title level={4}>
                      <CalendarOutlined style={{ marginRight: '10px' }} />
                      모임 세부 정보
                    </Title>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text strong>📅 모임 이름: </Text>
                        <Input
                          value={eventData.eventname}
                          readOnly
                          style={{ width: "100%", backgroundColor: "white" }}
                        />
                      </Col>

                      <Col span={12}>
                        <Text strong>📅 모임 UUID: </Text>
                        <Input
                          value={eventData.uuid}
                          readOnly
                          style={{ width: "100%", backgroundColor: "white" }}
                        />
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text strong>📅 시작 날짜: </Text>
                        <DatePicker
                          value={moment(eventData.startday)}
                          format="YYYY-MM-DD"
                          disabled
                          style={{ width: "100%", backgroundColor: "white" }}
                        />
                      </Col>

                      <Col span={12}>
                        <Text strong>📅 종료 날짜: </Text>
                        <DatePicker
                          value={moment(eventData.endday)}
                          format="YYYY-MM-DD"
                          disabled
                          style={{ width: "100%", backgroundColor: "white" }}
                        />
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Text strong>🕒 시작 시간: </Text>
                        <TimePicker
                          value={moment(eventData.startday)}
                          format="HH:mm"
                          disabled
                          style={{ width: "100%", backgroundColor: "white" }}
                        />
                      </Col>

                      <Col span={12}>
                        <Text strong>🕒 종료 시간: </Text>
                        <TimePicker
                          value={moment(eventData.endday)}
                          format="HH:mm"
                          disabled
                          style={{ width: "100%", backgroundColor: "white" }}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* Event Management Section - Placed Next to Event Details */}
                <Col span={12}>
                  <Card style={{ margin: "20px", padding: "0px" }}>
                    <Title level={4}>
                      <ToolOutlined style={{ marginRight: '10px' }} />
                      모임 관리
                    </Title>

                    {/* Kakao share and link copy button layout */}
                    <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
                    <Col span={12}>
                          <KakaoShareButton 
                            userInfo={userInfo} 
                            eventData={eventData} 
                          />
                          </Col>
                          <Col span={12}>
                          <Button 
                            type="default" 
                            block
                            onClick={handleCopyLink} 
                            style={{  marginBottom: '10px' }} // 여백 추가
                          >
                            🔗 일정 링크 복사
                          </Button>
                          </Col> 
                    </Row>

                    {/* Google Calendar buttons layout */}
                    <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
                      <Col span={12}>
                        <Button type="default" block style={{ marginBottom: "10px" }}>
                          📆 구글 캘린더 연동하기
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button type="default" block style={{ marginBottom: "10px" }}>
                          📆 구글 일정 불러오기
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button type="default" block>
                          📆 구글 캘린더로 내보내기
                        </Button>
                      </Col>
                      <Col span={12}>
                        <Button type="default" block>
                          📆 다른 버튼
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                </Col>

              </Row>

        {/* Rest of your code remains unchanged */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card style={{ margin: "20px", padding: "0px", overflowX: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Title level={4}>⌚ 내 일정 등록하기 !</Title>
                <Button type="primary" onClick={showModal} style={{ marginTop: "0" }}>
                  ⌚ 내가 등록한 일정 확인하기
                </Button>
              </div>

              {/* 모달 추가 */}
              <Modal
                title="내가 등록한 일정 확인하기"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
              >
                {(() => {
                  const mergedTimes = [];

                  userSelectedTimes.forEach((timeRange) => {
                    const startMoment = moment(timeRange, "YYYY-MM-DD HH:mm");
                    const endMoment = moment(startMoment).add(30, 'minutes');

                    if (mergedTimes.length === 0) {
                      mergedTimes.push({ start: startMoment, end: endMoment });
                    } else {
                      const lastRange = mergedTimes[mergedTimes.length - 1];
                      if (lastRange.end.isSame(startMoment)) {
                        lastRange.end = endMoment; // 연속된 경우 끝 시간 업데이트
                      } else {
                        mergedTimes.push({ start: startMoment, end: endMoment }); // 새로운 범위 추가
                      }
                    }
                  });

                  // 날짜 및 시간 순서대로 정렬
                  const sortedRanges = mergedTimes.sort((a, b) => {
                    if (a.start.isBefore(b.start)) return -1;
                    if (a.start.isAfter(b.start)) return 1;
                    return 0;
                  });

                  // 날짜별로 그룹화
                  const groupedRanges = sortedRanges.reduce((acc, range) => {
                    const dateKey = range.start.format("YYYY/MM/DD");
                    if (!acc[dateKey]) {
                      acc[dateKey] = [];
                    }
                    acc[dateKey].push(range);
                    return acc;
                  }, {});

                  return Object.entries(groupedRanges).map(([date, ranges]) => (
                    <div key={date}>
                      <div>📅 {date}</div>
                      {ranges.map((range, index) => {
                        const formattedStartTime = range.start.format("HH시 mm분");
                        const formattedEndTime = range.end.format("HH시 mm분");
                        return (
                          <div key={index} style={{ marginLeft: "20px" }}>
                            🕒 {formattedStartTime} 부터 {formattedEndTime}까지
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </Modal>

              <div className="schedule-selector-wrapper">
                <ScheduleSelector
                  selection={schedule}
                  numDays={numDays}
                  startDate={Schedule_Start}
                  minTime={moment(startTime, "HH:mm").hours()}
                  maxTime={moment(endTime, "HH:mm").hours()}
                  hourlyChunks={2}
                  rowGap="4px"
                  columnGap="7px"
                  onChange={handleScheduleChange}
                  renderTimeLabel={(time) => {
                    const formattedStartTime = moment(time).format("HH:mm");
                    const formattedEndTime = moment(time).add(30, "minutes").format("HH:mm");
                    return <div className="time-label">{formattedStartTime} - {formattedEndTime}</div>;
                  }}
                />
              </div>
              <Button type="primary" onClick={handleConfirm} style={{ marginTop: "20px" }} loading={confirmLoading}>
                확인
              </Button>
            </Card>
          </Col>
        


          <Col span={12}>
          <Card style={{ margin: "20px", padding: "0px", overflowX: "auto" }}>
              <Title level={4}>📅 모든 참가자들의 일정을 확인하세요 !
                <span style={{ marginLeft: "10px", fontSize: "14px" }}>
                  {/* 각 사용자에 대한 색상 매핑을 표시 */}
                  {allUsers.map((user, index) => (
                    <span key={index} style={{ marginLeft: "5px", color: userColorMap[user] }}>
                      ●( {userColorMap[user]} ) {user}
                    </span>
                  ))}
                </span>
              </Title>
              <div className="schedule-selector-wrapper">
                <ScheduleSelector
                  selection={schedule}
                  numDays={numDays}
                  startDate={Schedule_Start}
                  minTime={moment(startTime, "HH:mm").hours()}
                  maxTime={moment(endTime, "HH:mm").hours()}
                  hourlyChunks={2}
                  rowGap="4px"
                  columnGap="7px"
                  renderTimeLabel={(time) => {
                    const formattedStartTime = moment(time).format("HH:mm");
                    const formattedEndTime = moment(time).add(30, "minutes").format("HH:mm");
                    return <div className="time-label">{formattedStartTime} - {formattedEndTime}</div>;
                  }}
                  renderDateCell={(time, selected, innerRef) => {
                    const formattedTime = moment(time).format("YYYY-MM-DD HH:mm");
                    const users = userSchedules[formattedTime] || [];
                    const uniqueUsers = [...new Set(users)];

                    // 사용자의 색상으로 점을 표시
                    const dots = uniqueUsers.map((user, index) => {
                      const color = userColorMap[user];
                      return (
                        <span
                          key={index}
                          style={{
                            display: "inline-block",
                            marginLeft: "2px",
                            color: color,
                            fontSize: "14px"
                          }}
                        >
                          ●
                        </span>
                      );
                    });

                    return (
                      <Tooltip title={uniqueUsers.join(", ")} placement="top">
                        <div
                          ref={innerRef}
                          style={{
                            backgroundColor: `rgba(0, 128, 0, ${Math.min(0.1 + uniqueUsers.length * 0.1, 1)})`,
                            border: "1px solid #ccc",
                            height: "100%",
                            width: "100%",
                            position: "relative",
                            paddingRight: "5px"
                          }}
                        >
                          {/* 오른쪽에 점 배치 */}
                          <div style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)" }}>
                            {dots}
                          </div>
                        </div>
                      </Tooltip>
                    );
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
}

export default EventPage;
