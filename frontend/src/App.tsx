import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FundOutlined,
  ToolOutlined,
  BellOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import WaterQuality from './pages/WaterQuality';
import Equipment from './pages/Equipment';
import AlarmCenter from './pages/AlarmCenter';

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '总览仪表盘',
    },
    {
      key: '/water-quality',
      icon: <FundOutlined />,
      label: '水质数据管理',
    },
    {
      key: '/equipment',
      icon: <ToolOutlined />,
      label: '设备管理',
    },
    {
      key: '/alarms',
      icon: <BellOutlined />,
      label: '报警中心',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{ background: colorBgContainer }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: borderRadiusLG,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          污水运维平台
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer }}>
          <h2 style={{ margin: 0, lineHeight: '64px' }}>
            {menuItems.find((item) => item.key === location.pathname)?.label ||
              '污水处理站运维管理平台'}
          </h2>
        </Header>
        <Content style={{ margin: '24px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/water-quality" element={<WaterQuality />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/alarms" element={<AlarmCenter />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
