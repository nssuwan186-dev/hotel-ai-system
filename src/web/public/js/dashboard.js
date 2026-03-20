// Dashboard JavaScript

// Update date
function updateDate() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  document.getElementById('current-date').textContent = now.toLocaleDateString('th-TH', options);
}

// Fetch dashboard data
async function fetchDashboardData() {
  try {
    // Fetch rooms
    const roomsRes = await fetch('/api/rooms');
    const roomsData = await roomsRes.json();
    
    if (roomsData.success) {
      const rooms = roomsData.data;
      const totalRooms = rooms.length;
      const availableRooms = rooms.filter(r => r.status === 'available').length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Update room stats
      document.getElementById('total-rooms').textContent = totalRooms;
      document.getElementById('available-rooms').textContent = availableRooms;
      document.getElementById('checked-in').textContent = occupiedRooms;
      document.getElementById('occupied-rooms').textContent = `${occupiedRooms}/${totalRooms}`;
      
      // Update occupancy bar
      document.getElementById('occupancy-bar').style.width = `${occupancyRate}%`;
      document.getElementById('occupancy-text').textContent = `${occupancyRate}%`;
    }

    // Fetch notifications
    const notifRes = await fetch('/api/notifications');
    const notifData = await notifRes.json();
    
    if (notifData.success) {
      updateNotifications(notifData.data.notifications);
    }

    // Simulate revenue data (in production, fetch from API)
    updateRevenue();
    
    // Update recent bookings
    updateRecentBookings();

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
}

// Update revenue
function updateRevenue() {
  // Simulated data - replace with actual API call
  const totalRevenue = Math.floor(Math.random() * 100000) + 50000;
  const totalExpense = Math.floor(Math.random() * 30000) + 10000;
  const netProfit = totalRevenue - totalExpense;

  document.getElementById('total-revenue').textContent = `฿${totalRevenue.toLocaleString()}`;
  document.getElementById('total-expense').textContent = `฿${totalExpense.toLocaleString()}`;
  document.getElementById('net-profit').textContent = `฿${netProfit.toLocaleString()}`;

  // Today's payment
  const todayPayment = Math.floor(Math.random() * 20000) + 5000;
  document.getElementById('today-payment').textContent = `฿${todayPayment.toLocaleString()}`;
}

// Update recent bookings
function updateRecentBookings() {
  // Simulated data - replace with actual API call
  const bookings = [
    { customer: 'สมชาย', room: '101', status: 'checked_in', amount: 1500 },
    { customer: 'วิไล', room: '205', status: 'confirmed', amount: 2000 },
    { customer: 'ประภา', room: '302', status: 'checked_in', amount: 1800 },
  ];

  const tbody = document.getElementById('recent-bookings');
  
  if (bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">ไม่มีข้อมูล</td></tr>';
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>${b.customer}</td>
      <td>${b.room}</td>
      <td><span class="status-badge ${b.status}">${translateStatus(b.status)}</span></td>
      <td>฿${b.amount.toLocaleString()}</td>
    </tr>
  `).join('');
}

// Translate status
function translateStatus(status) {
  const translations = {
    'pending': 'รอดำเนินการ',
    'confirmed': 'ยืนยันแล้ว',
    'checked_in': 'เช็คอิน',
    'checked_out': 'เช็คเอาท์',
    'cancelled': 'ยกเลิก'
  };
  return translations[status] || status;
}

// Update notifications
function updateNotifications(notifications) {
  const list = document.getElementById('notifications-list');
  
  if (!notifications || notifications.length === 0) {
    list.innerHTML = `
      <div class="notification-item">
        <span class="notification-icon">ℹ️</span>
        <div class="notification-content">
          <span class="notification-text">ไม่มีการแจ้งเตือน</span>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = notifications.slice(0, 5).map(n => `
    <div class="notification-item">
      <span class="notification-icon">${getNotificationIcon(n.type)}</span>
      <div class="notification-content">
        <span class="notification-text">${n.title}</span>
        <small style="color: #999; display: block; margin-top: 5px;">${n.message}</small>
      </div>
    </div>
  `).join('');
}

// Get notification icon
function getNotificationIcon(type) {
  const icons = {
    'booking_reminder': '📅',
    'payment_due': '💰',
    'data_update': '📊',
    'system': '⚙️',
    'booking_alert': '🔔'
  };
  return icons[type] || 'ℹ️';
}

// Update today's activity
function updateTodayActivity() {
  // Simulated data
  document.getElementById('today-checkin').textContent = Math.floor(Math.random() * 10);
  document.getElementById('today-checkout').textContent = Math.floor(Math.random() * 10);
  document.getElementById('today-extension').textContent = Math.floor(Math.random() * 5);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateDate();
  fetchDashboardData();
  updateTodayActivity();
  
  // Refresh every 30 seconds
  setInterval(fetchDashboardData, 30000);
});

// WebSocket for real-time updates
function connectWebSocket() {
  const ws = new WebSocket(`ws://${window.location.host}/ws`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'notification') {
      fetchDashboardData(); // Refresh data
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    setTimeout(connectWebSocket, 5000); // Reconnect
  };
}

// Connect to WebSocket
connectWebSocket();
