import React, {Component} from 'react';
import 'weui';
import 'react-weui/build/packages/react-weui.css';
import {
    Flex,
    FlexItem,
    Panel,
    PanelBody,
    Tab,
    TabBody,
    NavBar,
    NavBarItem,
    Article,
    Toast,
    Dialog,
} from 'react-weui';
import './CSS/App.css';
// 引入 ECharts 主模块
import echarts from 'echarts/lib/echarts';
// 引入柱状图
import 'echarts/lib/chart/pie';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/bar';
// 引入提示框和标题组件
import 'echarts/lib/component/tooltip';
//import 'echarts/lib/component/legend';
import request from 'superagent';
import './App.css';
// import TabBody from "react-weui/src/components/tab/tab_body";
const API = typeof window.apiSite !== 'undefined' ? window.apiSite : '/';

class App extends Component {
    constructor(props) {
        super(props);
        this.colorList = [
            '#6ec8c0', '#4ac1e5', '#4f8db2', '#E87C25', '#27727B',
            '#FE8463', '#9BCA63', '#FAD860', '#F3A43B', '#60C0DD',
            '#D7504B', '#C6E579', '#F4E001', '#F0805A', '#26C0C0'
        ];
        this.myChart = null;
        this.topTab = [
            {
                id: 'today',
                name: '今天'
            }, {
                id: 'aWeek',
                name: '一周'
            }, {
                id: 'aMonth',
                name: '一个月'
            }, {
                id: 'aTerm',
                name: '本学期'
            },
        ];

        this.loading = true;
        this.state = {
            tabs: 0,
            tab: 0,
            statistic: [],
            isShowLoadMore: false,
            showLoading: false,
            loadingTimer: null,
            showIOS1: false,
            style1: {
                buttons: [
                    {
                        label: 'Ok',
                        onClick: this.hideDialog.bind(this)
                    }
                ]
            },
        };
        this.myChart = null;
    }

    componentWillUnmount() {
        this.state.loadingTimer && clearTimeout(this.state.loadingTimer);
    }

    hideDialog() {
        this.setState({
            showIOS1: false,
        });
    }

    showLoading = () => {
        this.setState({showLoading: true});
        this.state.loadingTimer = setTimeout(() => {
            this.setState({showLoading: false});
        }, 1000);
    }

    getChart = () => {
        if (!this.myChart) {
            this.myChart = echarts.init(this.refs.main);
        }
        return this.myChart;
    }

    // 绘制图表
    drawChart = (data = []) => {
        if (data.length === 0) {
            data = [{name: '暂无学习记录', value: 0}];
            // this.getChart()._dom.innerHTML = '暂无记录';
            // return;
        }
        const legend = data.map(v => v.name);
        this.getChart().setOption({
            tooltip: {
                trigger: 'item',
                formatter: "{a} <br/>{b}: {c} ({d}%)"
            },
            legend: {
                orient: 'vertical',
                x: 'left',
                data: legend
            },
            series: [
                {
                    name: '',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: true,
                    label: {
                        normal: {
                            show: true,
                            position: 'right'
                        },
                        emphasis: {
                            show: false,
                            textStyle: {
                                fontSize: '14',
                                fontWeight: 'bold'
                            }
                        }
                    },
                    itemStyle: {
                        normal: {
                            color: params => {
                                return this.colorList[params.dataIndex]
                            },
                            label: {
                                show: true,
                                position: 'top',
                                formatter: '{b}\n{c}'
                            }
                        }
                    },
                    labelLine: {
                        normal: {
                            show: true
                        }
                    },
                    data: data
                }
            ]
        });
    };

    componentDidMount() {
        // 基于准备好的dom，初始化echarts实例
    }

    componentWillMount() {
        this.getData();
    }

    handleClickTopTab = (i) => {
        this.setState({tab: i});
        this.getData(i);
    }
    //获取数据
    getData = (index = 0) => {
        this.loading = true;
        this.setState({isShowLoadMore: true})
        this.showLoading()
        const topTab = this.topTab[index];
        request.get(API + 'api/ranking/getStatistic').query({scope: topTab.id}).then(res => {
            const data = res.body;
            this.setState({
                statistic: data
            });
            this.drawChart(data.studySubjectAndDuration.map(v => ({value: v.studyDuration, name: v.subjectName})));
            this.drawLineChart(data.studyTimeLine);
            this.loading = false;
            this.setState({isShowLoadMore: false})
        }).catch(res => {
            if (res) {
                this.setState({isShowLoadMore: false})
                this.hello()

            }


        });
    }
    //网络请求超时，弹出框提示
    hello = () => {
        this.setState({showIOS1: true})
    }

    showLineChart = () => {
        const {statistic: {studyTimeLine}} = this.state;
        this.drawLineChart(studyTimeLine);
    };
    drawLineChart = (data = []) => {
        if (data.length === 0) {
            data.push({groupData: '暂无数据', studyDuration: 0});
        }
        const xAxis = data.map(v => v.groupData);
        const chartData = data.map(v => v.studyDuration);
        this.line(xAxis, chartData);
    };

    line = (xAxis, data) => {
        let myStudyChart = echarts.init(this.refs.line);
        myStudyChart.setOption({
            title: {
                text: ''
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                }
            },
            legend: {
                data: ['']
            },
            toolbox: {
                feature: {
                    saveAsImage: {}
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [
                {
                    type: 'category',
                    boundaryGap: false,
                    data: xAxis
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: [
                {
                    name: '分钟',
                    type: 'line',
                    stack: '学习时长',
                    label: {
                        normal: {
                            show: true,
                            position: 'top'
                        }
                    },
                    areaStyle: {normal: {}},
                    data: data
                }
            ]
        });
    }

    render() {
        const {tab, statistic: {completedCourseCount, studyDuration, studySubjectAndDuration = [],}} = this.state;
        const chartStyle = {height: '300px'};
        return (
            <div className="App">

                <Tab>
                    <NavBar className="topNavbar">
                        {this.topTab.map((v, i) =>
                            <NavBarItem key={i} active={tab === i}
                                        onClick={() => this.handleClickTopTab(i)}>{v.name}</NavBarItem>
                        )}
                    </NavBar>
                    <TabBody>
                        <Article>
                            <Dialog type="ios" title={this.state.style1.title} buttons={this.state.style1.buttons}
                                    show={this.state.showIOS1}>
                                网络请求超时，请重试...
                            </Dialog>
                            <div id="flexWrp">
                                <Flex>
                                    <FlexItem>
                                        <div className="placeholder" onClick={this.showLoading}>完成课程</div>
                                    </FlexItem>
                                    <FlexItem>
                                        <div className="placeholder">学习时长</div>
                                    </FlexItem>
                                </Flex>
                                <Flex>
                                    <FlexItem>
                                        <div className="placeholder-bot">{completedCourseCount}个</div>
                                    </FlexItem>
                                    <FlexItem>
                                        <div className="placeholder-bot">{studyDuration}</div>
                                    </FlexItem>
                                </Flex>
                            </div>
                            <Toast icon="loading" show={this.state.showLoading}>数据加载中</Toast>

                            <Tab>
                                <NavBar className="secondNav">
                                    <NavBarItem active={this.state.tabs == 0}
                                                onClick={e => this.setState({tabs: 0})}>学习时长分配</NavBarItem>
                                    <NavBarItem active={this.state.tabs == 1} onClick={e => {
                                        this.setState({tabs: 1});
                                        setTimeout(this.showLineChart, 0);
                                    }}>学习时间曲线</NavBarItem>
                                </NavBar>
                                <TabBody>
                                    <Article style={{display: this.state.tabs == 0 ? null : 'none'}}>
                                        <div ref="main" style={chartStyle}></div>
                                        {studySubjectAndDuration.length > 0 ? (<div>
                                            <Panel>
                                                <PanelBody>
                                                    <div className="botTable">
                                                        <table style={{
                                                            border: '0px solid red ',
                                                            width: '100%',
                                                            height: '100%',
                                                            marginTop: '10px',
                                                            fontSize: '14px'
                                                        }}>
                                                            <tr>
                                                                <th>分类</th>
                                                                <th>科目</th>
                                                                <th>已学习</th>
                                                                <th>学习时长</th>
                                                            </tr>
                                                            {studySubjectAndDuration.map((v, i) => (
                                                                <tr key={i}>
                                                                    <td>
                                                                        <div id="tdBox"
                                                                             style={{background: `${this.colorList[i]}`}}>
                                                                        </div>
                                                                    </td>
                                                                    <td>{v.subjectName}</td>
                                                                    <td>{v.courseNumber}个</td>
                                                                    <td>{v.studyDuration}分钟</td>
                                                                </tr>
                                                            ))}
                                                        </table>
                                                    </div>
                                                </PanelBody>
                                            </Panel>
                                        </div>) : ''}
                                    </Article>
                                    <Article style={{display: this.state.tabs == 1 ? null : 'none'}}>
                                        <div ref="line" id="line" style={{height: '300px'}}>

                                        </div>
                                    </Article>
                                </TabBody>
                            </Tab>
                        </Article>
                    </TabBody>
                </Tab>

            </div>
        );
    }
}

export default App;
