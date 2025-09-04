document.addEventListener('DOMContentLoaded', function() {
  // 初始化页面
  fetchDepositRates();
  
  // 设置刷新按钮点击事件
  document.getElementById('refresh-rates').addEventListener('click', fetchDepositRates);
  
  // 设置货币筛选器变化事件
  document.getElementById('currency-filter').addEventListener('change', filterRates);
  
  // 每6小时自动刷新一次数据
  setInterval(fetchDepositRates, 6 * 60 * 60 * 1000);
});

// 获取存款利率数据
function fetchDepositRates() {
  // 显示加载状态
  document.getElementById('last-updated').textContent = '最后更新: 加载中...';
  document.getElementById('rates-tbody').innerHTML = '<tr><td colspan="5" class="loading">加載中...</td></tr>';
  
  // 获取创兴银行数据
  fetch('/api/chong-hing-rates')
    .then(response => response.json())
    .then(chongHingRates => {
      // 这里可以添加其他银行的API调用
      
      // 合并所有银行数据
      const allRates = [
        ...chongHingRates
        // 其他银行数据...
      ];
      
      // 存储数据到全局变量
      window.allDepositRates = allRates;
      
      // 更新最后更新时间
      const now = new Date();
      document.getElementById('last-updated').textContent = `最后更新: ${now.toLocaleString('zh-HK')}`;
      
      // 显示数据
      displayRates(allRates);
    })
    .catch(error => {
      console.error('Error fetching deposit rates:', error);
      document.getElementById('rates-tbody').innerHTML = '<tr><td colspan="5" class="error">獲取數據失敗，請稍後再試</td></tr>';
    });
}

// 显示存款利率数据
function displayRates(rates) {
  const tbody = document.getElementById('rates-tbody');
  tbody.innerHTML = '';
  
  if (rates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="no-data">沒有找到數據</td></tr>';
    return;
  }
  
  // 应用当前筛选器
  const currencyFilter = document.getElementById('currency-filter').value;
  const filteredRates = currencyFilter === 'all' 
    ? rates 
    : rates.filter(rate => rate.currency === currencyFilter);
  
  // 按货币、期限和利率排序
  filteredRates.sort((a, b) => {
    if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
    if (a.term !== b.term) return a.term.localeCompare(b.term);
    return parseFloat(b.interestRate) - parseFloat(a.interestRate);
  });
  
  // 创建表格行
  filteredRates.forEach(rate => {
    const row = document.createElement('tr');
    
    // 银行列
    const bankCell = document.createElement('td');
    bankCell.textContent = rate.bank;
    row.appendChild(bankCell);
    
    // 货币列
    const currencyCell = document.createElement('td');
    currencyCell.textContent = rate.currency;
    row.appendChild(currencyCell);
    
    // 存款期限列
    const termCell = document.createElement('td');
    termCell.textContent = rate.term;
    row.appendChild(termCell);
    
    // 利率列
    const rateCell = document.createElement('td');
    rateCell.textContent = rate.interestRate;
    // 如果是最高利率，添加高亮样式
    if (isHighestRate(rate.currency, rate.term, rate.interestRate, filteredRates)) {
      rateCell.classList.add('highest-rate');
    }
    row.appendChild(rateCell);
    
    // 最后更新列
    const updatedCell = document.createElement('td');
    const updatedDate = new Date(rate.lastUpdated);
    updatedCell.textContent = updatedDate.toLocaleDateString('zh-HK');
    row.appendChild(updatedCell);
    
    tbody.appendChild(row);
  });
}

// 检查是否是最高利率
function isHighestRate(currency, term, rate, allRates) {
  const sameCurrencyAndTerm = allRates.filter(r => r.currency === currency && r.term === term);
  return sameCurrencyAndTerm.every(r => parseFloat(r.interestRate) <= parseFloat(rate));
}

// 应用筛选器
function filterRates() {
  if (window.allDepositRates) {
    displayRates(window.allDepositRates);
  }
}
