import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Tag, Badge, Spin, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { dashboardApi } from '../services/api';
import type { DashboardStationOverview, ComplianceRateData } from '../types';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardStationOverview[]>([]);
  const [complianceData, setComplianceData] = useState<Record<string, ComplianceRateData[]>>({});
  const [unhandledCount, setUnhandledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, complianceRes, countRes] = await Promise.all([
          dashboardApi.getOverview(),
          dashboardApi.getComplianceRate(30),
          dashboardApi.getUnhandledAlarmsCount(),
        ]);
        setOverview(overviewRes.data);
        setComplianceData(complianceRes.data);
        setUnhandledCount(countRes.data.count);
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getComplianceChartOption = () => {
    const stationNames = Object.keys(complianceData);
    if (stationNames.length === 0) return {};

    const dates = complianceData[stationNames[0]]?.map((item) => item.date.slice(5)) || [];
    const series = stationNames.map((name) => ({
      name,
      type: 'line',
      data: complianceData[name].map((item) => item.rate),
      smooth: true,
    }));

    return {
      title: { text: '本月达标率趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: stationNames, bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', min: 0, max: 100, name: '达标率(%)' },
      series,
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>运行总览</Title>
        <Badge count={unhandledCount} showZero>
          <Tag color="red" style={{ fontSize: 14, padding: '4px 12px' }}>
            <WarningOutlined /> 未处理报警
          </Tag>
        </Badge>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {overview.map((station) => (
          <Col xs={24} md={8} key={station.station_id}>
            <Card
              title={station.station_name}
              extra={
                station.latest_water_quality?.is_compliant ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>达标</Tag>
                ) : (
                  <Tag color="error" icon={<CloseCircleOutlined />}>超标</Tag>
                )
              }
            >
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic title="设计处理量" value={station.design_capacity} suffix="吨/天" />
                </Col>
                <Col span={12}>
                  <Statistic title="工艺类型" value={station.process_type} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="出水COD"
                    value={station.latest_water_quality?.outflow_cod || '-'}
                    suffix="mg/L"
                    valueStyle={{
                      color: (station.latest_water_quality?.outflow_cod || 0) > 50 ? '#cf1322' : '#3f8600',
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="出水氨氮"
                    value={station.latest_water_quality?.outflow_nh3n || '-'}
                    suffix="mg/L"
                    valueStyle={{
                      color: (station.latest_water_quality?.outflow_nh3n || 0) > 5 ? '#cf1322' : '#3f8600',
                    }}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="故障设备"
                    value={station.fault_equipment_count}
                    suffix="台"
                    valueStyle={{ color: station.fault_equipment_count > 0 ? '#cf1322' : '#3f8600' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <ReactECharts option={getComplianceChartOption()} style={{ height: 400 }} />
      </Card>
    </div>
  );
};

export default Dashboard;
