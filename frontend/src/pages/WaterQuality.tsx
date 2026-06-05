import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Table,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Tag,
  Space,
  message,
  Spin,
  Typography,
} from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { waterQualityApi, stationApi } from '../services/api';
import type { Station, WaterQualityRecord, WaterQualityStats } from '../types';

const { Title } = Typography;
const { Option } = Select;

const WaterQuality: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [stats, setStats] = useState<WaterQualityStats[]>([]);
  const [records, setRecords] = useState<WaterQualityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await stationApi.getAll();
        setStations(res.data);
        if (res.data.length > 0) {
          setSelectedStation(res.data[0].id);
        }
      } catch (error) {
        console.error('获取站点列表失败:', error);
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      fetchData();
    }
  }, [selectedStation]);

  const fetchData = async () => {
    if (!selectedStation) return;
    setLoading(true);
    try {
      const [statsRes, recordsRes] = await Promise.all([
        waterQualityApi.getStats(selectedStation, 30),
        waterQualityApi.getAll({ station_id: selectedStation }),
      ]);
      setStats(statsRes.data);
      setRecords(recordsRes.data);
    } catch (error) {
      console.error('获取水质数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = (type: 'cod' | 'nh3n') => {
    const dates = stats.map((item) => item.date.slice(5));
    const inflowKey = type === 'cod' ? 'inflow_cod' : 'inflow_nh3n';
    const outflowKey = type === 'cod' ? 'outflow_cod' : 'outflow_nh3n';
    const standardLine = type === 'cod' ? 50 : 5;
    const title = type === 'cod' ? 'COD对比图' : '氨氮对比图';
    const unit = 'mg/L';

    return {
      title: { text: title, left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['进水', '出水', '达标线'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: unit },
      series: [
        {
          name: '进水',
          type: 'line',
          data: stats.map((item) => item[inflowKey]),
          smooth: true,
        },
        {
          name: '出水',
          type: 'line',
          data: stats.map((item) => item[outflowKey]),
          smooth: true,
        },
        {
          name: '达标线',
          type: 'line',
          data: new Array(dates.length).fill(standardLine),
          lineStyle: { type: 'dashed', color: 'red' },
          symbol: 'none',
        },
      ],
    };
  };

  const handleSubmit = async (values: any) => {
    if (!selectedStation) return;
    try {
      await waterQualityApi.create({
        station_id: selectedStation,
        record_date: values.record_date.format('YYYY-MM-DD'),
        sample_time: values.sample_time,
        inflow_cod: values.inflow_cod,
        inflow_nh3n: values.inflow_nh3n,
        inflow_tp: values.inflow_tp,
        inflow_ss: values.inflow_ss,
        inflow_ph: values.inflow_ph,
        outflow_cod: values.outflow_cod,
        outflow_nh3n: values.outflow_nh3n,
        outflow_tp: values.outflow_tp,
        outflow_ss: values.outflow_ss,
        outflow_ph: values.outflow_ph,
        remark: values.remark,
      });
      message.success('录入成功');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '录入失败');
    }
  };

  const handleExport = async () => {
    if (!selectedStation) return;
    try {
      const res = await waterQualityApi.export(selectedStation);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '水质数据.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('导出失败');
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'record_date', key: 'record_date' },
    { title: '取样时间', dataIndex: 'sample_time', key: 'sample_time' },
    { title: '进水COD', dataIndex: 'inflow_cod', key: 'inflow_cod', render: (v: number) => `${v} mg/L` },
    { title: '出水COD', dataIndex: 'outflow_cod', key: 'outflow_cod', render: (v: number) => `${v} mg/L` },
    { title: '进水氨氮', dataIndex: 'inflow_nh3n', key: 'inflow_nh3n', render: (v: number) => `${v} mg/L` },
    { title: '出水氨氮', dataIndex: 'outflow_nh3n', key: 'outflow_nh3n', render: (v: number) => `${v} mg/L` },
    {
      title: '状态',
      dataIndex: 'is_compliant',
      key: 'is_compliant',
      render: (v: boolean) => (v ? <Tag color="success">达标</Tag> : <Tag color="error">超标</Tag>),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>水质数据管理</Title>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="选择站点"
            value={selectedStation}
            onChange={setSelectedStation}
          >
            {stations.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            录入数据
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出数据
          </Button>
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              <Card>
                <ReactECharts option={getChartOption('cod')} style={{ height: 350 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card>
                <ReactECharts option={getChartOption('nh3n')} style={{ height: 350 }} />
              </Card>
            </Col>
          </Row>

          <Card title="历史数据">
            <Table columns={columns} dataSource={records} rowKey="id" pagination={{ pageSize: 10 }} />
          </Card>
        </>
      )}

      <Modal
        title="录入水质数据"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="record_date" label="记录日期" initialValue={dayjs()} rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sample_time" label="取样时间" initialValue="上午" rules={[{ required: true }]}>
                <Select>
                  <Option value="上午">上午</Option>
                  <Option value="下午">下午</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Title level={5}>进水水质</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="inflow_cod" label="COD (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={1000} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inflow_nh3n" label="氨氮 (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inflow_ph" label="pH" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={14} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inflow_tp" label="总磷 (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="inflow_ss" label="SS (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Title level={5}>出水水质</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="outflow_cod" label="COD (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={1000} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="outflow_nh3n" label="氨氮 (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="outflow_ph" label="pH" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={14} step={0.1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="outflow_tp" label="总磷 (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="outflow_ss" label="SS (mg/L)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default WaterQuality;
