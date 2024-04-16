import React, { useState } from 'react';
import { Navbar, Nav, Offcanvas, Container } from 'react-bootstrap';

// 남색 계열의 색상 정의
const navyTheme = {
  backgroundColor: "#003366", // 진한 남색
  color: "#ffffff", // 텍스트 색상은 흰색으로
};

const CommonHeaderAndSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen); // 사이드바 열림/닫힘 상태 토글
  };

  return (
    <>
      <Navbar expand={false} style={navyTheme}>
        <Container fluid>
          {/* 햄버거 버튼을 로고의 왼쪽에 배치 */}
          <Navbar.Toggle aria-controls="offcanvasNavbar" onClick={handleToggleSidebar} />
          {/* 로고 이미지 추가 */}
          <Navbar.Brand href="#" style={{marginLeft: "15px"}}>
            <img
              src="/logo.png" // public 폴더에 있는 이미지 경로
              width="30" // 로고의 너비, 적절하게 조절
              height="30" // 로고의 높이, 적절하게 조절
              className="d-inline-block align-top"
              alt="Logo"
            />
            Your Brand
          </Navbar.Brand>
          <Navbar.Offcanvas
            id="offcanvasNavbar"
            aria-labelledby="offcanvasNavbarLabel"
            placement="start"
            style={navyTheme}
            show={isSidebarOpen} // 사이드바의 열림/닫힘 상태에 따라 show 속성 조정
            onHide={handleToggleSidebar} // 사이드바를 닫을 때 호출되는 함수
          >
            <Offcanvas.Header closeButton style={navyTheme}>
              <Offcanvas.Title id="offcanvasNavbarLabel" style={navyTheme}>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body style={navyTheme}>
              <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link href="#home" style={navyTheme}>Home</Nav.Link>
                <Nav.Link href="#link" style={navyTheme}>Link</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
      <div style={{ marginLeft: isSidebarOpen ? '250px' : '0', transition: 'margin-left 0.3s' }}>
        {/* 메인 컨텐츠 영역. 사이드바가 열리면 여기의 marginLeft가 조정됩니다. */}
        <p>여기에 메인 컨텐츠가 위치합니다.</p>
      </div>
    </>
  );
}

export default CommonHeaderAndSidebar;
