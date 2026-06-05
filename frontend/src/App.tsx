import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ProLayout, { PageContainer } from '@ant-design/pro-layout';
import {
  DashboardOutlined,
  FundOutlined,
  ToolOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import WaterQuality from './pages/WaterQuality';
import Equipment from './pages/Equipment';
import AlarmCenter from './pages/AlarmCenter';
import Inspection from './pages/Inspection';
import Chemical from './pages/Chemical';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuData = [
    {
      path: '/',
      name: '总览仪表盘',
      icon: <DashboardOutlined />,
    },
    {
      path: '/water-quality',
      name: '水质数据管理',
      icon: <FundOutlined />,
    },
    {
      path: '/equipment',
      name: '设备管理',
      icon: <ToolOutlined />,
    },
    {
      path: '/inspection',
      name: '巡检管理',
      icon: <CheckCircleOutlined />,
    },
    {
      path: '/chemical',
      name: '药剂库存管理',
      icon: <ShoppingOutlined />,
    },
    {
      path: '/alarms',
      name: '报警中心',
      icon: <BellOutlined />,
    },
  ];

  return (
    <div style={{ height: '100vh' }}>
      <ProLayout
        title="污水运维平台"
        logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
        route={{
          routes: menuData,
        }}
        menuItemRender={(itemProps, defaultDom) => (
          <a onClick={() => navigate(itemProps.path || '/')}>{defaultDom}</a>
        )}
        location={{ pathname: location.pathname }}
      >
        <PageContainer
          header={{
            title: menuData.find((m) => m.path === location.pathname)?.name || '污水处理站运维管理平台',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/water-quality" element={<WaterQuality />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/inspection" element={<Inspection />} />
            <Route path="/chemical" element={<Chemical />} />
            <Route path="/alarms" element={<AlarmCenter />} />
          </Routes>
        </PageContainer>
      </ProLayout>
    </div>
  );
};

export default App;
