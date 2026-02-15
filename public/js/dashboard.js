// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js}', './views/**/*.html'], // Đảm bảo trỏ đúng các file HTML của bạn
  theme: {
    extend: {
      colors: {
        // Bộ màu nâu chủ đạo
        brown: {
          50: '#F9F6F4', // Nền kem rất nhạt
          100: '#F5F1EE', // Nền kem chính (Main Background)
          200: '#ECE5DF', // Viền nhạt
          300: '#D5C8BD',
          400: '#BFA99A',
          500: '#855E42', // Màu điểm nhấn 2 (Hover, Secondary)
          600: '#6D4C35',
          700: '#573D2A',
          800: '#4A3B32', // Màu chính đậm nhất (Primary Text/Bg)
          900: '#3D3029'
        }
      },
      fontFamily: {
        // Nếu bạn có font riêng thì thêm vào đây
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}

// 1. Kiểm tra Token
const accessToken = localStorage.getItem('access_token')
const userProfile = localStorage.getItem('user_profile')

// 2. Nếu không có token -> Đá về Login ngay lập tức
function checkAccess(access_token) {
  if (!accessToken || !userProfile) {
    alert('⛔ Bạn chưa đăng nhập!')
    window.location.href = '/' // Hoặc trang login
  }
}
checkAccess(accessToken)
// 3. Kiểm tra Role (Parse JSON từ LocalStorage)
// Lưu ý: Đây chỉ là chặn UI, hacker vẫn có thể sửa LocalStorage
// Nhưng không sao, vì API lấy dữ liệu thật đã được Server bảo vệ.
try {
  const user = JSON.parse(userProfile)
  // Giả sử Role Admin là 0
  if (user.role !== 0) {
    alert('⛔ Bạn không có quyền truy cập trang này!')
    window.location.href = '/'
  }
} catch (e) {
  window.location.href = '/'
}

// Hàm Javascript để vẽ bảng (Thêm vào script cuối file dashboard.html)
async function loadPendingUsers() {
  // 1. Lấy đúng cái TBODY để điền dữ liệu (Không lấy cả mainContent nữa)
  const tableBody = document.getElementById('user-table-body')

  // Nếu chưa có bảng (lỡ xóa nhầm HTML) thì không chạy tiếp
  if (!tableBody) {
    console.error('Không tìm thấy bảng #user-table-body')
    return
  }

  // Hiển thị loading trong bảng cho đẹp
  tableBody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-brown-500">⏳ Đang tải danh sách...</td></tr>'

  try {
    const response = await fetch('/admin/pending', {
      // Kiểm tra lại route này
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access_token')
      }
    })

    const data = await response.json()

    if (!response.ok) {
      // alert('Lỗi: ' + (data.message || 'Không thể lấy dữ liệu'));
      tableBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-red-500">❌ ${data.message || 'Lỗi tải dữ liệu'}</td></tr>`
      return
    }

    const users = data.result || []

    // Kiểm tra nếu không có user nào
    if (users.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="3" class="p-8 text-center text-brown-400 italic">Không có thành viên nào cần duyệt.</td></tr>'
      return
    }

    // 2. Render HTML vào trong TBODY
    const html = users
      .map((user) => {
        // Xử lý ngày tháng an toàn
        let dateStr = '---'
        try {
          if (user.created_at) dateStr = new Date(user.created_at).toLocaleDateString('vi-VN')
        } catch (e) {}

        // Xử lý tên hiển thị (ưu tiên name, nếu ko có thì lấy email cắt ra)
        const displayName = user.name || user.email.split('@')[0]

        return `
            <tr class="hover:bg-brown-50 transition border-b border-brown-50">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-brown-200 rounded-full flex items-center justify-center text-brown-800 font-bold mr-3 uppercase">
                            ${displayName.charAt(0)}
                        </div>
                        <div>
                            <p class="font-bold text-brown-800">${displayName}</p>
                            <p class="text-xs text-brown-500">${user.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                     <span class="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Chờ duyệt
                     </span>
                     <p class="text-xs text-brown-400 mt-1">Đăng ký: ${dateStr}</p>
                </td>
                <td class="px-6 py-4">
                    <div class="flex space-x-2">
                        <button onclick="approveUser('${user._id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition shadow-sm flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                            Duyệt
                        </button>
                        <button onclick="rejectUser('${user._id}')" class="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium transition flex items-center">
                             <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            Xóa
                        </button>
                    </div>
                </td>
            </tr>
            `
      })
      .join('')

    tableBody.innerHTML = html
  } catch (error) {
    console.error('Lỗi fetch:', error)
    tableBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-500">❌ Lỗi kết nối server!</td></tr>'
  }
}
// Hàm xử lý nút Duyệt
async function approveUser(userId) {
  if (!confirm('Bạn có chắc muốn duyệt thành viên này?')) return

  try {
    // Gọi API Backend
    const response = await fetch(`/admin/approve/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access_token') // Nhớ gửi token admin
      }
    })

    if (response.ok) {
      alert('✅ Đã duyệt thành công!')
      loadPendingUsers() // Tải lại bảng
    } else {
      alert('❌ Có lỗi xảy ra')
    }
  } catch (error) {
    console.error(error)
  }
}

async function handleLogout() {
  // 1. Hỏi người dùng cho chắc (Optional)
  if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) return

  try {
    const refreshToken = localStorage.getItem('refresh_token')
    const accessToken = localStorage.getItem('access_token')

    // 2. GỌI API BACKEND (Để xóa token trên server)
    // Dù API này lỗi hay thành công, ta vẫn phải xóa local storage ở bước 3
    if (refreshToken) {
      await fetch('/users/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
    }
  } catch (error) {
    console.log('Lỗi gọi API Logout (không quan trọng):', error)
  } finally {
    // 3. XÓA SẠCH LOCAL STORAGE (Quan trọng nhất)
    // Bắt buộc phải chạy dù API có lỗi hay không
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_profile')

    // 4. CHUYỂN HƯỚNG VỀ TRANG LOGIN
    alert('👋 Đã đăng xuất thành công. Hẹn gặp lại!')
    window.location.href = '/'
  }
}

function switchTab(element, title) {
  // 1. Cập nhật Tiêu đề trang
  document.getElementById('header-title').innerText = title

  // 2. Xử lý giao diện Sidebar
  // Tìm tất cả các thẻ a trong thẻ nav (Menu items)
  const menuItems = document.querySelectorAll('aside nav a')

  // Các class cho trạng thái ACTIVE (Đang chọn): Nền nâu, chữ trắng
  const activeClasses = ['bg-brown-500', 'text-white', 'shadow-md']

  // Các class cho trạng thái INACTIVE (Không chọn): Chữ nhạt, hover nền tối
  const inactiveClasses = ['text-brown-200', 'hover:bg-brown-900', 'hover:text-white']

  // Vòng lặp: Reset tất cả về trạng thái "Inactive"
  menuItems.forEach((item) => {
    item.classList.remove(...activeClasses) // Bỏ active
    item.classList.add(...inactiveClasses) // Thêm inactive

    // Xóa cái vạch trắng trang trí bên phải (nếu có)
    const indicator = item.querySelector('div.absolute')
    if (indicator) indicator.remove()
  })

  // 3. Kích hoạt menu vừa được bấm (element)
  element.classList.remove(...inactiveClasses) // Bỏ inactive
  element.classList.add(...activeClasses) // Thêm active

  // Thêm lại cái vạch trắng trang trí cho đẹp (Optional)
  const indicatorHTML = '<div class="absolute right-0 top-0 h-full w-1 bg-white rounded-l-lg opacity-30"></div>'
  element.insertAdjacentHTML('beforeend', indicatorHTML)

  // B1: Lấy các thẻ div nội dung
  const overviewSection = document.getElementById('overview-section')
  const productSection = document.getElementById('product-section')
  const approve = document.getElementById('approve-section')
  // B2: Mặc định ẩn tất cả đi trước (Thêm class hidden)
  if (overviewSection) overviewSection.classList.add('hidden')
  if (productSection) productSection.classList.add('hidden')
  if (approve) approve.classList.add('hidden')

  // (Nếu bạn có làm phần duyệt thành viên bằng div riêng thì thêm vào đây)
  // const approveSection = document.getElementById('approve-section');
  // if(approveSection) approveSection.classList.add('hidden');

  // B3: Kiểm tra title để hiện đúng cái cần xem
  // Lưu ý: Chuỗi text phải khớp với cái bạn viết trong onclick ở HTML
  if (title === 'Tổng quan hệ thống' || title === 'Tổng quan') {
    if (overviewSection) overviewSection.classList.remove('hidden')
  } else if (title === 'Quản lý sản phẩm' || title === 'Sản phẩm') {
    if (productSection) productSection.classList.remove('hidden')
  } else if (title === 'Duyệt thành viên mới') {
    if (approve) approve.classList.remove('hidden')
    // Gọi hàm load dữ liệu luôn ở đây cho tiện (hoặc giữ nguyên onclick ở HTML)
    if (typeof loadPendingUsers === 'function') {
      loadPendingUsers()
    }
  }
}

async function handleAddProduct(event) {
  event.preventDefault()

  // 1. Lấy dữ liệu từ form
  const form = event.target
  const formData = new FormData(form)
  const data = Object.fromEntries(formData.entries())

  try {
    // 2. Gửi lên API Private (Kèm Token Admin)
    const response = await fetch('/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access_token') // 👈 QUAN TRỌNG
      },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      alert('✅ Đăng sản phẩm thành công!')
      form.reset() // Xóa trắng form
      // Có thể gọi hàm loadProducts() để cập nhật lại danh sách bên dưới
    } else {
      alert('❌ Lỗi: Bạn không có quyền hoặc dữ liệu sai')
    }
  } catch (error) {
    console.error(error)
  }
}
