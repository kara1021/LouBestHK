// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    // 初始化Header和Footer
    renderHeader();
    renderFooter();
    
    // 检查是否是 hibor_overnight.html 页面
    if (document.getElementById('hibor-data-date')) {
        console.log("检测到 HIBOR 页面，开始加载数据...");
        
        // 获取当前日期和90天前的日期作为查询范围
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        
        // 格式化日期为YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        // 构建API URL - 使用成功代码中的参数格式
        const apiUrl = `https://api.hkma.gov.hk/public/market-data-and-statistics/daily-monetary-statistics/daily-figures-interbank-liquidity?from=${formatDate(startDate)}&to=${formatDate(today)}`;
        console.log("API URL:", apiUrl);
        
        // 获取API数据
        fetch(apiUrl)
            .then(response => {
                console.log("API 响应状态:", response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('API返回原始数据:', data);
                
                // 检查API返回的数据结构 - 使用成功代码中的检查方式
                if (data && data.header && data.header.success && data.result && data.result.records) {
                    const records = data.result.records;
                    console.log('数据记录数量:', records.length);
                    
                    if (records.length > 0) {
                        // 按日期降序排序（最新的在前）
                        const sortedRecords = [...records].sort((a, b) => {
                            const dateA = new Date(getDateValue(a));
                            const dateB = new Date(getDateValue(b));
                            return dateB - dateA;
                        });
                        
                        // 获取最新数据
                        const latestRecord = sortedRecords[0];
                        console.log('最新数据:', latestRecord);
                        
                        // 更新页面数据
                        updatePageData(latestRecord);
                        
                        // 初始化历史数据功能
                        initHistoricalData();
                    } else {
                        console.error('API返回数据为空');
                        document.getElementById('last-updated').textContent = '暂无数据';
                        document.getElementById('hibor-data-date').textContent = '暂无数据';
                    }
                } else {
                    console.error('API返回数据格式错误');
                    document.getElementById('last-updated').textContent = '数据格式错误';
                    document.getElementById('hibor-data-date').textContent = '数据格式错误';
                }
            })
            .catch(error => {
                console.error('获取数据失败:', error);
                document.getElementById('last-updated').textContent = '获取数据失败，请稍后再试';
                document.getElementById('hibor-data-date').textContent = '获取数据失败，请稍后再试';
            });
    }
    
    // 初始化历史数据功能
    function initHistoricalData() {
        // 检查是否已经存在历史数据容器
        if (document.getElementById('historical-data-container')) {
            return; // 如果已存在，则不再创建
        }
        
        // 创建历史数据容器 - 添加数据卡片样式
        const historicalDataContainer = document.createElement('div');
        historicalDataContainer.id = 'historical-data-container';
        historicalDataContainer.className = 'historical-data-container hibor-data-card'; // 添加 hibor-data-card 类
        
        // 创建历史数据标题容器
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        titleContainer.style.display = 'flex';
        titleContainer.style.justifyContent = 'space-between';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.marginBottom = '20px';
        
        const titleElement = document.createElement('h2');
        titleElement.textContent = '歷史數據';
        titleElement.className = 'historical-data-title';
        titleElement.style.margin = '0'; // 重置边距
        
        // 创建默认预载数据范围显示 - 移到标题旁边
        const defaultDataRange = document.createElement('div');
        defaultDataRange.id = 'default-data-range';
        defaultDataRange.className = 'default-data-range';
        defaultDataRange.style.margin = '0'; // 重置边距
        
        titleContainer.appendChild(titleElement);
        titleContainer.appendChild(defaultDataRange);
        historicalDataContainer.appendChild(titleContainer);
        
        // 创建控制面板
        const controlPanel = document.createElement('div');
        controlPanel.className = 'control-panel';
        
        // 创建开始日期选择器
        const startDateLabel = document.createElement('label');
        startDateLabel.textContent = '開始日期: ';
        const startDateInput = document.createElement('input');
        startDateInput.type = 'date';
        startDateInput.id = 'historical-start-date';
        
        // 设置默认开始日期为30天前
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        startDateInput.value = formatDate(defaultStartDate);
        
        startDateLabel.appendChild(startDateInput);
        controlPanel.appendChild(startDateLabel);
        
        // 创建结束日期选择器
        const endDateLabel = document.createElement('label');
        endDateLabel.textContent = '結束日期: ';
        const endDateInput = document.createElement('input');
        endDateInput.type = 'date';
        endDateInput.id = 'historical-end-date';
        
        // 设置默认结束日期为今天
        const defaultEndDate = new Date();
        endDateInput.value = formatDate(defaultEndDate);
        
        endDateLabel.appendChild(endDateInput);
        controlPanel.appendChild(endDateLabel);
        
        // 创建每页显示记录数选择器
        const pageSizeLabel = document.createElement('label');
        pageSizeLabel.textContent = '每頁顯示: ';
        const pageSizeSelect = document.createElement('select');
        pageSizeSelect.id = 'page-size';
        
        const pageSizes = [10, 20, 50, 100];
        pageSizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size + ' 筆';
            if (size === 10) {
                option.selected = true;
            }
            pageSizeSelect.appendChild(option);
        });
        
        pageSizeLabel.appendChild(pageSizeSelect);
        controlPanel.appendChild(pageSizeLabel);
        
        // 创建查询按钮
        const searchButton = document.createElement('button');
        searchButton.textContent = '查詢';
        searchButton.id = 'historical-search-btn';
        searchButton.className = 'search-button';
        controlPanel.appendChild(searchButton);
        
        historicalDataContainer.appendChild(controlPanel);
        
        // 创建表格容器
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        // 创建表格
        const table = document.createElement('table');
        table.id = 'historical-data-table';
        table.className = 'data-table';
        
        // 创建表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['日期', '收市總結餘', '貼現窗基本利率', '隔夜港元銀行同業拆息', '一個月期港元銀行同業拆息定價'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // 创建表体
        const tbody = document.createElement('tbody');
        tbody.id = 'historical-data-tbody';
        table.appendChild(tbody);
        
        tableContainer.appendChild(table);
        historicalDataContainer.appendChild(tableContainer);
        
        // 创建分页控件
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        // 创建上一页按钮
        const prevButton = document.createElement('button');
        prevButton.textContent = '上一頁';
        prevButton.id = 'prev-page';
        prevButton.className = 'pagination-button';
        prevButton.disabled = true;
        paginationContainer.appendChild(prevButton);
        
        // 创建页码显示
        const pageInfo = document.createElement('span');
        pageInfo.id = 'page-info';
        pageInfo.textContent = '第 0 頁，共 0 頁';
        paginationContainer.appendChild(pageInfo);
        
        // 创建下一页按钮
        const nextButton = document.createElement('button');
        nextButton.textContent = '下一頁';
        nextButton.id = 'next-page';
        nextButton.className = 'pagination-button';
        nextButton.disabled = true;
        paginationContainer.appendChild(nextButton);
        
        historicalDataContainer.appendChild(paginationContainer);
        
        // 创建图表容器
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'charts-container';
        
        // 创建收市总结合图表容器
        const balanceChartContainer = document.createElement('div');
        balanceChartContainer.className = 'chart-container';
        balanceChartContainer.innerHTML = `
            <h3>收市總結餘走勢圖</h3>
            <canvas id="balance-chart"></canvas>
        `;
        chartsContainer.appendChild(balanceChartContainer);
        
        // 创建利率走势图表容器
        const ratesChartContainer = document.createElement('div');
        ratesChartContainer.className = 'chart-container';
        ratesChartContainer.innerHTML = `
            <h3>利率走勢圖</h3>
            <canvas id="rates-chart"></canvas>
        `;
        chartsContainer.appendChild(ratesChartContainer);
        
        historicalDataContainer.appendChild(chartsContainer);
        
        // 将历史数据容器添加到页面中
        const dataCardsContainer = document.querySelector('.hibor-data-cards-container');
        if (dataCardsContainer) {
            dataCardsContainer.parentNode.insertBefore(historicalDataContainer, dataCardsContainer.nextSibling);
        } else {
            // 如果找不到数据卡片容器，则添加到页面底部
            document.body.appendChild(historicalDataContainer);
        }
        
        // 添加查询按钮点击事件
        searchButton.addEventListener('click', fetchHistoricalData);
        
        // 添加分页按钮点击事件
        prevButton.addEventListener('click', () => changePage(-1));
        nextButton.addEventListener('click', () => changePage(1));
        
        // 添加每页显示记录数变化事件
        pageSizeSelect.addEventListener('change', () => {
            currentPage = 1;
            fetchHistoricalData();
        });
        
        // 初始化变量
        let historicalData = [];
        let currentPage = 1;
        let pageSize = 10;
        let balanceChart = null;
        let ratesChart = null;
        
        // 计算并显示默认预载数据范围（最近7个工作天）
        function updateDefaultDataRange() {
            const endDate = new Date();
            const startDate = new Date();
            
            // 计算最近7个工作天（排除周末）
            let workDays = 0;
            while (workDays < 7) {
                startDate.setDate(startDate.getDate() - 1);
                // 检查是否是工作日（周一到周五）
                if (startDate.getDay() !== 0 && startDate.getDay() !== 6) {
                    workDays++;
                }
            }
            
            // 更新默认预载数据范围显示
            const defaultDataRangeElement = document.getElementById('default-data-range');
            if (defaultDataRangeElement) {
                defaultDataRangeElement.textContent = `默認預載最近7個工作天的數據︰${formatDate(startDate)} 至 ${formatDate(endDate)}`;
            }
            
            // 设置日期选择器的默认值
            document.getElementById('historical-start-date').value = formatDate(startDate);
            document.getElementById('historical-end-date').value = formatDate(endDate);
            
            // 自动加载默认数据
            fetchHistoricalData();
        }
        
        // 初始化默认预载数据范围
        updateDefaultDataRange();
        
        // 获取历史数据
        function fetchHistoricalData() {
            const startDate = document.getElementById('historical-start-date').value;
            const endDate = document.getElementById('historical-end-date').value;
            pageSize = parseInt(document.getElementById('page-size').value);
            
            if (!startDate || !endDate) {
                alert('請選擇開始日期和結束日期');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('開始日期不能晚於結束日期');
                return;
            }
            
            // 显示加载指示器
            const tbody = document.getElementById('historical-data-tbody');
            tbody.innerHTML = '<tr><td colspan="5" class="loading">加載中...</td></tr>';
            
            // 构建API URL
            const apiUrl = `https://api.hkma.gov.hk/public/market-data-and-statistics/daily-monetary-statistics/daily-figures-interbank-liquidity?from=${startDate}&to=${endDate}`;
            console.log("历史数据API URL:", apiUrl);
            
            // 获取API数据
            fetch(apiUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('历史数据API返回数据:', data);
                    
                    if (data && data.header && data.header.success && data.result && data.result.records) {
                        historicalData = data.result.records;
                        
                        if (historicalData.length > 0) {
                            // 按日期升序排序（用于图表显示）
                            const chartData = [...historicalData].sort((a, b) => {
                                const dateA = new Date(getDateValue(a));
                                const dateB = new Date(getDateValue(b));
                                return dateA - dateB;
                            });
                            
                            // 准备图表数据
                            const labels = chartData.map(record => getDateValue(record));
                            const balanceData = chartData.map(record => getBalanceValue(record));
                            const baseRateData = chartData.map(record => getBaseRateValue(record));
                            const hiborOvernightData = chartData.map(record => getHiborOvernightValue(record));
                            const hibor1mData = chartData.map(record => getHibor1mValue(record));
                            
                            // 按日期降序排序（用于表格显示）
                            historicalData.sort((a, b) => {
                                const dateA = new Date(getDateValue(a));
                                const dateB = new Date(getDateValue(b));
                                return dateB - dateA;
                            });
                            
                            currentPage = 1;
                            displayHistoricalData();
                            
                            // 更新图表，传递用户选择的日期范围
                            updateCharts(labels, balanceData, baseRateData, hiborOvernightData, hibor1mData, startDate, endDate);
                        } else {
                            tbody.innerHTML = '<tr><td colspan="5" class="no-data">沒有找到數據</td></tr>';
                            updatePaginationInfo(0, 0);
                        }
                    } else {
                        throw new Error('API返回数据格式错误');
                    }
                })
                .catch(error => {
                    console.error('获取历史数据失败:', error);
                    tbody.innerHTML = '<tr><td colspan="5" class="error">獲取數據失敗，請稍後再試</td></tr>';
                    updatePaginationInfo(0, 0);
                });
        }
        
        // 更新图表 - 修改为接受7个参数
        function updateCharts(labels, balanceData, baseRateData, hiborOvernightData, hibor1mData, startDate, endDate) {
            // 确保Chart.js已加载
            if (typeof Chart === 'undefined') {
                console.error('Chart.js库未加载');
                return;
            }
            
            // 销毁现有图表（如果存在）
            if (balanceChart) {
                balanceChart.destroy();
            }
            if (ratesChart) {
                ratesChart.destroy();
            }
            
            // 创建收市总结合图表
            const balanceCtx = document.getElementById('balance-chart').getContext('2d');
            balanceChart = new Chart(balanceCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '收市總結餘 (百萬港元)',
                        data: balanceData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `收市總結餘走勢圖 (${startDate} 至 ${endDate})`,
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('zh-HK').format(context.parsed.y) + ' 百萬港元';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: '百萬港元'
                            }
                        }
                    }
                }
            });
            
            // 创建利率走势图表
            const ratesCtx = document.getElementById('rates-chart').getContext('2d');
            ratesChart = new Chart(ratesCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '貼現窗基本利率 (%)',
                            data: baseRateData,
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.1,
                            fill: false
                        },
                        {
                            label: '隔夜港元銀行同業拆息 (%)',
                            data: hiborOvernightData,
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            tension: 0.1,
                            fill: false
                        },
                        {
                            label: '一個月期港元銀行同業拆息定價 (%)',
                            data: hibor1mData,
                            borderColor: 'rgb(255, 206, 86)',
                            backgroundColor: 'rgba(255, 206, 86, 0.2)',
                            tension: 0.1,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `利率走勢圖 (${startDate} 至 ${endDate})`,
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y.toFixed(4) + '%';
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: '利率 (%)'
                            }
                        }
                    }
                }
            });
        }
        
        // 显示历史数据
        function displayHistoricalData() {
            const tbody = document.getElementById('historical-data-tbody');
            tbody.innerHTML = '';
            
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = Math.min(startIndex + pageSize, historicalData.length);
            const pageData = historicalData.slice(startIndex, endIndex);
            
            pageData.forEach(record => {
                const row = document.createElement('tr');
                
                // 获取各种数值
                const dateValue = getDateValue(record);
                const balanceValue = getBalanceValue(record);
                const baseRateValue = getBaseRateValue(record);
                const hiborOvernightValue = getHiborOvernightValue(record);
                const hibor1mValue = getHibor1mValue(record);
                
                // 创建单元格
                const dateCell = document.createElement('td');
                dateCell.textContent = dateValue;
                row.appendChild(dateCell);
                
                const balanceCell = document.createElement('td');
                balanceCell.textContent = balanceValue.toLocaleString('zh-HK');
                row.appendChild(balanceCell);
                
                const baseRateCell = document.createElement('td');
                baseRateCell.textContent = baseRateValue.toFixed(2) + '%';
                row.appendChild(baseRateCell);
                
                const hiborOvernightCell = document.createElement('td');
                hiborOvernightCell.textContent = hiborOvernightValue.toFixed(4) + '%';
                row.appendChild(hiborOvernightCell);
                
                const hibor1mCell = document.createElement('td');
                hibor1mCell.textContent = hibor1mValue.toFixed(4) + '%';
                row.appendChild(hibor1mCell);
                
                tbody.appendChild(row);
            });
            
            // 更新分页信息
            const totalPages = Math.ceil(historicalData.length / pageSize);
            updatePaginationInfo(currentPage, totalPages);
        }
        
        // 更新分页信息
        function updatePaginationInfo(currentPage, totalPages) {
            document.getElementById('page-info').textContent = `第 ${currentPage} 頁，共 ${totalPages} 頁`;
            
            document.getElementById('prev-page').disabled = currentPage <= 1;
            document.getElementById('next-page').disabled = currentPage >= totalPages;
        }
        
        // 切换页面
        function changePage(direction) {
            const totalPages = Math.ceil(historicalData.length / pageSize);
            const newPage = currentPage + direction;
            
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                displayHistoricalData();
            }
        }
        
        // 格式化日期为YYYY-MM-DD
        function formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }
    
    // 获取日期值
    function getDateValue(record) {
        // 检查多种可能的日期字段
        if (record.as_at_date) {
            return record.as_at_date;
        } else if (record.date) {
            return record.date;
        } else if (record.end_of_date) {
            return record.end_of_date;
        } else if (record.ref_date) {
            return record.ref_date;
        } else {
            console.log("无法找到日期字段，记录对象:", record);
            return "未知日期";
        }
    }
    
    // 获取结余值
    function getBalanceValue(record) {
        // 首先尝试使用 closing_balance 字段
        if (record.closing_balance !== undefined && record.closing_balance !== null) {
            const value = parseFloat(record.closing_balance);
            if (!isNaN(value)) {
                console.log(`使用 closing_balance 字段，值: ${value}`);
                return value;
            }
        }
        
        // 如果 closing_balance 不存在，尝试其他可能的字段
        const possibleFields = [
            'closing_balance_hkd',
            'end_of_day_balance_hkd',
            'balance_hkd', 
            'aggregate_balance_hkd',
            'hkd_balance',
            'interbank_balance',
            'liquidity_balance',
            'banking_system_balance',
            'system_balance',
            'balance_figure',
            'monetary_base',
            'monetary_base_hkd',
            'outstanding_amount',
            'outstanding_amount_hkd'
        ];
        
        for (const field of possibleFields) {
            if (record[field] !== undefined && record[field] !== null) {
                const value = parseFloat(record[field]);
                if (!isNaN(value)) {
                    console.log(`找到结余字段: ${field}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        // 如果没有找到任何字段，尝试遍历所有属性
        console.log("尝试遍历所有属性查找可能的结余字段...");
        for (const key in record) {
            if (typeof record[key] === 'number' || 
                (typeof record[key] === 'string' && !isNaN(parseFloat(record[key])))) {
                const value = parseFloat(record[key]);
                if (!isNaN(value) && value !== 0) {
                    console.log(`可能找到结余字段: ${key}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        console.log("无法找到结余字段，记录对象:", record);
        return 0;
    }
    
    // 获取基本利率值
    function getBaseRateValue(record) {
        // 尝试使用 disc_win_base_rate 字段
        if (record.disc_win_base_rate !== undefined && record.disc_win_base_rate !== null) {
            const value = parseFloat(record.disc_win_base_rate);
            if (!isNaN(value)) {
                console.log(`使用 disc_win_base_rate 字段，值: ${value}`);
                return value;
            }
        }
        
        // 如果 disc_win_base_rate 不存在，尝试其他可能的字段
        const possibleFields = [
            'base_rate',
            'base_rate_percent',
            'discount_rate',
            'discount_window_rate',
            'policy_rate'
        ];
        
        for (const field of possibleFields) {
            if (record[field] !== undefined && record[field] !== null) {
                const value = parseFloat(record[field]);
                if (!isNaN(value)) {
                    console.log(`找到基本利率字段: ${field}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        // 如果没有找到任何字段，尝试遍历所有属性
        console.log("尝试遍历所有属性查找可能的基本利率字段...");
        for (const key in record) {
            if (typeof record[key] === 'number' || 
                (typeof record[key] === 'string' && !isNaN(parseFloat(record[key])))) {
                const value = parseFloat(record[key]);
                if (!isNaN(value) && value > 0 && value < 10) { // 基本利率通常在0-10%之间
                    console.log(`可能找到基本利率字段: ${key}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        console.log("无法找到基本利率字段，记录对象:", record);
        return 0;
    }
    
    // 获取隔夜港元银行同业拆息值
    function getHiborOvernightValue(record) {
        // 尝试使用 hibor_overnight 字段
        if (record.hibor_overnight !== undefined && record.hibor_overnight !== null) {
            const value = parseFloat(record.hibor_overnight);
            if (!isNaN(value)) {
                console.log(`使用 hibor_overnight 字段，值: ${value}`);
                return value;
            }
        }
        
        // 如果 hibor_overnight 不存在，尝试其他可能的字段
        const possibleFields = [
            'hibor_overnight_percent',
            'hibor_on',
            'overnight_hibor',
            'hibor_o_n'
        ];
        
        for (const field of possibleFields) {
            if (record[field] !== undefined && record[field] !== null) {
                const value = parseFloat(record[field]);
                if (!isNaN(value)) {
                    console.log(`找到隔夜港元银行同业拆息字段: ${field}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        // 如果没有找到任何字段，尝试遍历所有属性
        console.log("尝试遍历所有属性查找可能的隔夜港元银行同业拆息字段...");
        for (const key in record) {
            if (typeof record[key] === 'number' || 
                (typeof record[key] === 'string' && !isNaN(parseFloat(record[key])))) {
                const value = parseFloat(record[key]);
                if (!isNaN(value) && value >= 0 && value < 10) { // HIBOR通常在0-10%之间
                    console.log(`可能找到隔夜港元银行同业拆息字段: ${key}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        console.log("无法找到隔夜港元银行同业拆息字段，记录对象:", record);
        return 0;
    }
    
    // 获取一个月期港元银行同业拆息定价值
    function getHibor1mValue(record) {
        // 尝试使用 hibor_fixing_1m 字段
        if (record.hibor_fixing_1m !== undefined && record.hibor_fixing_1m !== null) {
            const value = parseFloat(record.hibor_fixing_1m);
            if (!isNaN(value)) {
                console.log(`使用 hibor_fixing_1m 字段，值: ${value}`);
                return value;
            }
        }
        
        // 如果 hibor_fixing_1m 不存在，尝试其他可能的字段
        const possibleFields = [
            'hibor_1m',
            'hibor_1_month',
            'hibor_fixing_1_month',
            'one_month_hibor'
        ];
        
        for (const field of possibleFields) {
            if (record[field] !== undefined && record[field] !== null) {
                const value = parseFloat(record[field]);
                if (!isNaN(value)) {
                    console.log(`找到一个月期港元银行同业拆息定价字段: ${field}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        // 如果没有找到任何字段，尝试遍历所有属性
        console.log("尝试遍历所有属性查找可能的一个月期港元银行同业拆息定价字段...");
        for (const key in record) {
            if (typeof record[key] === 'number' || 
                (typeof record[key] === 'string' && !isNaN(parseFloat(record[key])))) {
                const value = parseFloat(record[key]);
                if (!isNaN(value) && value >= 0 && value < 10) { // HIBOR通常在0-10%之间
                    console.log(`可能找到一个月期港元银行同业拆息定价字段: ${key}, 值: ${value}`);
                    return value;
                }
            }
        }
        
        console.log("无法找到一个月期港元银行同业拆息定价字段，记录对象:", record);
        return 0;
    }
    
    // 更新页面数据
    function updatePageData(record) {
        // 获取各种数值
        const balanceValue = getBalanceValue(record);
        const baseRateValue = getBaseRateValue(record);
        const hiborOvernightValue = getHiborOvernightValue(record);
        const hibor1mValue = getHibor1mValue(record);
        const dateValue = getDateValue(record);
        
        // 更新收市总结余
        const closingBalanceElement = document.getElementById('closing-balance');
        if (closingBalanceElement) {
            closingBalanceElement.textContent = balanceValue.toLocaleString('zh-HK');
        }
        
        // 更新贴现窗基本利率
        const discWinBaseRateElement = document.getElementById('disc-win-base-rate');
        if (discWinBaseRateElement) {
            discWinBaseRateElement.textContent = baseRateValue.toFixed(2) + '%';
        }
        
        // 更新隔夜港元银行同业拆息
        const hiborOvernightElement = document.getElementById('hibor-overnight');
        if (hiborOvernightElement) {
            hiborOvernightElement.textContent = hiborOvernightValue.toFixed(4) + '%';
        }
        
        // 更新一个月期港元银行同业拆息定价
        const hiborFixing1mElement = document.getElementById('hibor-fixing-1m');
        if (hiborFixing1mElement) {
            hiborFixing1mElement.textContent = hibor1mValue.toFixed(4) + '%';
        }
        
        // 更新日期
        if (dateValue && dateValue !== "未知日期") {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                const dateStr = date.toLocaleDateString('zh-HK', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                // 更新H1下方的日期显示
                const hiborDataDateElement = document.getElementById('hibor-data-date');
                if (hiborDataDateElement) {
                    hiborDataDateElement.textContent = `數據最後更新日期: ${dateStr}`;
                }
                
                // 更新数据卡片中的日期显示
                const lastUpdatedElement = document.getElementById('last-updated');
                if (lastUpdatedElement) {
                    lastUpdatedElement.textContent = `最後更新: ${dateStr}`;
                }
            } else {
                console.error('日期无效:', dateValue);
                document.getElementById('last-updated').textContent = '日期格式无效';
                document.getElementById('hibor-data-date').textContent = '日期格式无效';
            }
        } else {
            console.error('无法找到日期字段，数据对象:', record);
            document.getElementById('last-updated').textContent = '无法确定数据日期';
            document.getElementById('hibor-data-date').textContent = '无法确定数据日期';
        }
    }
});

// Header配置
const headerConfig = {
    logo: {
        imageSrc: 'images/LouBestHK_Logo.png',
        altText: '老Best的大自在空間 Logo',
        title: '老Best的大自在空間'
    },
    youtubeLink: {
        url: 'https://youtube.com/channel/UCcNIfZr5U1b1_-74BY-LBuA/',
        text: '請多支持我的YouTube 頻道，目標500訂閱'
    },
    menuItems: [
        { text: '首頁', url: 'index.html' },
        //{ text: '渣打馬拉松儲蓄戶口', url: 'marathon-savings-account.html' },
        //{ text: 'Mox Flexi Booster Savings', url: 'flexi-booster.html' },
        //{ text: '兌外幣再做定存 收益計算機', url: 'fx-deposit-return.html' },
        //{ text: '一般定期存款計算機', url: 'time_deposit_calculator.html' },
        { text: '香港銀行體系結餘與利率數據', url: 'hibor_overnight.html' }
    ]
};

// Footer配置
const footerConfig = {
    copyrightText: '© 2025 老Best的大自在空間 保留所有權利',
    disclaimer: '免責聲明︰本網站的計算機僅用於估算目的，其計算結果可能因利率變動、銀行政策、稅務規定及其他不可預見因素而有所差異。本計算機提供的任何資訊不應被視為專業財務建議或任何形式的承諾。您應自行承擔依賴這些資訊所產生的風險。若您需要準確的財務資訊或專業建議，請諮詢合格的財務顧問或相關金融機構。對於因使用本計算機所產計的任何損失或損害，本網站/應用程式概不負責。'
};

// 渲染Header
function renderHeader() {
    const headerElement = document.querySelector('.page-header');
    
    let headerHTML = `
        <div class="header-container">
            <div class="logo-section">
                <a href="index.html" class="logo-link">
                    <img src="${headerConfig.logo.imageSrc}" alt="${headerConfig.logo.altText}">
                    <div class="site-title">${headerConfig.logo.title}</div>
                </a>
            </div>
            <nav class="main-nav">
                <ul class="nav-menu">
    `;
    
    headerConfig.menuItems.forEach(item => {
        headerHTML += `<li><a href="${item.url}" class="nav-link">${item.text}</a></li>`;
    });
    
    headerHTML += `
            </ul>
            <div class="menu-toggle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </nav>
        <div class="header-actions">
            <a href="${headerConfig.youtubeLink.url}" target="_blank" class="youtube-link">
                <svg class="youtube-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span class="youtube-text">${headerConfig.youtubeLink.text}</span>
            </a>
        </div>
    </div>
    `;
    
    headerElement.innerHTML = headerHTML;
    
    // 添加移动端菜单切换功能
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
}

// 渲染Footer
function renderFooter() {
    const footerElement = document.querySelector('footer');
    
    let footerHTML = `
        <div class="footer-content">
            <div class="footer-section full-width">
                <h3>免責聲明</h3>
                <p>${footerConfig.disclaimer}</p>
            </div>
            <div class="footer-bottom">
                <div class="footer-copyright">${footerConfig.copyrightText}</div>
            </div>
        </div>
    `;
    
    footerElement.innerHTML = footerHTML;
    
    // 添加内联样式以确保免责声明占用整个宽度
    const disclaimerSection = document.querySelector('.footer-section.full-width');
    if (disclaimerSection) {
        disclaimerSection.style.cssText = `
            width: 100% !important;
            max-width: 100% !important;
            flex: 0 0 100% !important;
            text-align: justify !important;
            margin: 0 auto !important;
            padding: 20px 0 !important;
            box-sizing: border-box !important;
            display: block !important;
            float: none !important;
            clear: both !important;
        `;
    }
    
    // 确保footer-content也占用整个宽度
    const footerContent = document.querySelector('.footer-content');
    if (footerContent) {
        footerContent.style.cssText = `
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            box-sizing: border-box !important;
        `;
    }
    
    // 将免责声明的h3标题改为白色
    const disclaimerTitle = document.querySelector('.footer-section.full-width h3');
    if (disclaimerTitle) {
        disclaimerTitle.style.cssText = `
            color: white !important;
        `;
    }
}
