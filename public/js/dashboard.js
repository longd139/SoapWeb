// Biến lưu trữ các link ảnh sau khi upload xong
window.globalImageUrls = []
// 1. Kiểm tra Token
const accessToken = localStorage.getItem('access_token')
const userProfile = localStorage.getItem('user_profile')

// 2. Nếu không có token -> Đá về Login ngay lập tức

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

// document.addEventListener('DOMContentLoaded', () => {
//   const addProductForm = document.getElementById('add-product-form')
//   if (addProductForm) {
//     addProductForm.addEventListener('submit', handleAddProduct)
//   }
// })

// Biến toàn cục để theo dõi trạng thái sửa (Mặc định là null)
window.currentEditingId = null

window.handleAddProduct = async function (event) {
  event.preventDefault()

  const form = event.target
  const btnSubmit = document.getElementById('btn-submit')
  const loadingScreen = document.getElementById('upload-loading')

  // 1. LẤY DỮ LIỆU TỪ FORM
  const formData = new FormData(form)
  const data = Object.fromEntries(formData.entries())

  try {
    // --- 🛠️ BƯỚC MỚI: XỬ LÝ UPLOAD ẢNH CHỐT HẠ ---
    // Chỉ upload nếu có file mới được chọn ở biến tạm 'selectedFile'
    // (selectedFile là biến mình đã lưu ở hàm handlePreviewImages)
    if (window.selectedFile) {
      // Hiện loading che màn hình để người dùng không bấm lung tung
      if (loadingScreen) loadingScreen.classList.remove('hidden')
      btnSubmit.disabled = true
      btnSubmit.innerHTML = ' đang nén & tải ảnh...'

      // A. Nén ảnh
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, fileType: 'image/jpeg' }
      const compressedFile = await imageCompression(window.selectedFile, options)

      // B. Upload lên Cloudinary
      const uploadFormData = new FormData()
      uploadFormData.append('images', compressedFile)

      const uploadRes = await fetch('/admin/medias/upload-multiple', {
        method: 'POST',
        body: uploadFormData
      })
      const uploadResult = await uploadRes.json()

      if (!uploadRes.ok) throw new Error(uploadResult.message || 'Lỗi upload ảnh')

      // C. Lấy URL trả về và gán vào data để gửi lên DB
      // Vì chú chỉ muốn 1 ảnh, ta lấy phần tử đầu tiên
      data.images = uploadResult.result[0] || uploadResult.urls[0]
    } else {
      // Nếu không chọn ảnh mới (trường hợp Sửa sản phẩm mà giữ nguyên ảnh cũ)
      // thì lấy lại ảnh cũ đang hiển thị trong globalImageUrls
      data.images = window.globalImageUrls || []
    }
    // ----------------------------------------------

    // 🛠️ 2. CHUẨN HÓA DỮ LIỆU SỐ
    if (data.price) data.price = Number(data.price)
    if (data.quantity) data.quantity = Number(data.quantity)

    // 🛠️ 3. XÁC ĐỊNH CHẾ ĐỘ: THÊM HAY SỬA?
    let apiUrl = '/products/add-product'
    let apiMethod = 'POST'
    let successMessage = 'Đăng sản phẩm thành công!'

    if (window.currentEditingId) {
      apiUrl = `/products/${window.currentEditingId}`
      apiMethod = 'PUT'
      successMessage = 'Cập nhật sản phẩm thành công!'
    }

    // 4. GỬI DỮ LIỆU LÊN DATABASE
    const response = await fetch(apiUrl, {
      method: apiMethod,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access_token')
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (response.ok) {
      // ✅ THÀNH CÔNG
      if (typeof showToast === 'function') showToast(successMessage, 'success')

      // 5. RESET TOÀN BỘ
      form.reset()
      document.getElementById('preview-container').innerHTML =
        '<p class="text-xs text-gray-400 w-full text-center py-4">Chưa có ảnh nào được chọn</p>'
      window.globalImageUrls = []
      window.selectedFile = null // Xóa file tạm
      window.currentEditingId = null

      // Reset nút bấm
      btnSubmit.innerHTML = `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg> Đăng sản phẩm`
      btnSubmit.classList.add('bg-brown-600')
      btnSubmit.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'opacity-75', 'cursor-not-allowed')
      btnSubmit.disabled = false

      if (typeof loadAdminProducts === 'function') loadAdminProducts()
    } else {
      throw new Error(result.message || 'Lỗi server')
    }
  } catch (error) {
    if (error.message === 'Jwt expired') {
      showToast('Phiên đăng nhập đã hết hạn, đang quay về trang chủ...', 'error')
      localStorage.removeItem('access_token') // Xóa token hết hạn
      // Chờ 2 giây rồi chuyển về trang login
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      return
    } else if (typeof showToast === 'function') showToast('❌ Lỗi: ' + error.message, 'error')
    console.error(error)
  } finally {
    if (loadingScreen) loadingScreen.classList.add('hidden')
    btnSubmit.disabled = false
  }
}

async function loadAdminProducts() {
  const tableBody = document.getElementById('admin-product-list')

  try {
    const response = await fetch('/products/list-all')
    const data = await response.json()
    const products = data.result || []

    window.allProducts = products // lưu Danh sách

    if (products.length === 0) {
      tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                <div class="flex flex-col items-center justify-center">
                    <i class="fas fa-box-open text-4xl text-brown-200 mb-3"></i>
                    <p>Chưa có sản phẩm nào được đăng.</p>
                </div>
            </td>
        </tr>`
      return
    }

    const html = products
      .map((product) => {
        // Format giá tiền
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)

        // 👇 SỬA ĐOẠN NÀY: Ưu tiên lấy ảnh đầu tiên trong mảng images
        let displayImage = 'https://placehold.co/150?text=No+Image' // Dùng trang này ổn định hơn

        if (product.images && product.images.length > 0) {
          displayImage = product.images[0] // Lấy ảnh đầu tiên
        } else if (product.image) {
          displayImage = product.image // Fallback cho dữ liệu cũ (nếu có)
        }

        // Random tồn kho
        const stock = product.quantity || Math.floor(Math.random() * 50) + 1
        const stockColor = stock < 10 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'

        return `
            <tr class="hover:bg-[#FDFBF7] transition duration-150 group">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-brown-200">
                            <img src="${displayImage}" class="h-full w-full object-cover object-center" alt="${product.name}">
                        </div>
                        <div class="ml-4">
                            <div class="font-medium text-brown-800 text-sm">${product.name}</div>
                            <div class="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">${product._id}</div>
                        </div>
                    </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm font-bold text-brown-600">${price}</span>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-brown-100 text-brown-800 border border-brown-200">
                        ${product.category || 'Mặc định'}
                    </span>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="px-2 py-1 text-xs font-bold rounded ${stockColor}">
                        ${stock}
                    </span>
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                      <button 
            onclick="startEditProduct('${product._id}')" 
            class="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium border border-blue-200"
            title="Chỉnh sửa"
        >
            <i class="fas fa-pencil-alt"></i>
            <span>Sửa</span>
        </button>

                      <button 
                          onclick="deleteProduct('${product._id}')" 
                          class="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium"
                          title="Xóa sản phẩm"
                      >
                          <i class="fas fa-trash-alt"></i>
                          <span>Xóa</span>
                      </button>
                  </div>
              </td>
            </tr>
            `
      })
      .join('')

    tableBody.innerHTML = html
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error)
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-8 text-center text-red-500">
                <i class="fas fa-exclamation-triangle mb-2"></i><br>
                Không thể tải dữ liệu. Vui lòng thử lại sau.
            </td>
        </tr>`
  }
}

// 2. Hàm Xóa Sản Phẩm (Đã cập nhật)
async function deleteProduct(id) {
  // Dùng confirm mặc định của trình duyệt (hoặc sau này thay bằng Modal riêng)
  if (!confirm('⚠️ Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
    return
  }

  try {
    const response = await fetch(`/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access_token')
      }
    })

    const result = await response.json()

    if (response.ok) {
      // ✅ THÀNH CÔNG: Hiện thông báo xanh
      showToast('Xóa sản phẩm thành công!', 'success')

      // Load lại bảng
      loadAdminProducts()
    } else {
      // ❌ THẤT BẠI: Hiện thông báo đỏ
      showToast(result.message || 'Lỗi khi xóa sản phẩm', 'error')
    }
  } catch (error) {
    console.error(error)
    showToast('Lỗi kết nối server', 'error')
  }
}

// 1. Hàm hiển thị thông báo đẹp (Thay thế alert)
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container')
  if (!container) return // Tránh lỗi nếu quên chưa thêm container vào HTML

  const toast = document.createElement('div')

  const isSuccess = type === 'success'
  // Màu xanh lá chuẩn Tailwind (bg-green-500) và bo góc (rounded-lg)
  const bgColor = isSuccess ? 'bg-[#2ecc71]' : 'bg-[#e74c3c]'
  const icon = isSuccess ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>'

  // Thêm độ bóng và khoảng cách
  toast.className = `min-w-[250px] ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transform transition-all duration-500 translate-x-full opacity-0`

  toast.innerHTML = `
      <div class="text-xl">${icon}</div>
      <div class="font-bold text-sm">${message}</div>
  `

  container.appendChild(toast)

  // Hiệu ứng trượt vào
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0')
  }, 10)

  // Tự động biến mất
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0')
    setTimeout(() => {
      toast.remove()
    }, 500)
  }, 3000)
}
// Chạy hàm khi trang tải xong
document.addEventListener('DOMContentLoaded', loadAdminProducts)

let selectedFile = null // Biến tạm lưu file gốc

function handlePreviewImages(event) {
  const file = event.target.files[0]
  const previewContainer = document.getElementById('preview-container')

  if (!file) return

  selectedFile = file // Lưu lại để tí nữa bấm "Đăng" mới dùng

  // Hiển thị preview ngay lập tức bằng FileReader
  const reader = new FileReader()
  reader.onload = function (e) {
    previewContainer.innerHTML = `
      <div class="relative w-24 h-24 group">
        <img src="${e.target.result}" class="w-full h-full object-cover rounded-lg border border-gray-300">
        <button 
          type="button"
          onclick="removeProductImage()"
          class="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition z-10 font-bold"
        >
          ×
        </button>
      </div>
    `
  }
  reader.readAsDataURL(file)
}

// Hàm bổ trợ để xóa ảnh
function removeProductImage() {
  selectedFile = null
  document.getElementById('files-input').value = ''
  document.getElementById('preview-container').innerHTML =
    '<p class="text-xs text-gray-400 w-full text-center py-4">Chưa có ảnh nào được chọn</p>'
}
// Biến toàn cục để biết đang sửa sản phẩm nào (null = đang thêm mới)
let currentEditingId = null

// 1. HÀM BẮT ĐẦU SỬA (KHI BẤM NÚT XANH)
// 1. Hàm Mở Modal và Đổ dữ liệu
function startEditProduct(id) {
  const product = window.allProducts.find((p) => p._id === id)
  if (!product) return
  // Giả sử product.price là 5000000
  const priceDisplay = document.getElementById('price-display')
  const priceRaw = document.getElementById('price-raw')

  if (priceDisplay && priceRaw) {
    priceRaw.value = product.price // Lưu 5000000
    priceDisplay.value = new Intl.NumberFormat('de-DE').format(product.price) // Hiển thị 5.000.000
  }

  window.currentEditingId = id
  const modal = document.getElementById('edit-modal')
  const form = document.getElementById('edit-product-form')

  // Đổ dữ liệu vào form modal
  form.elements['name'].value = product.name
  form.elements['price'].value = product.price
  form.elements['quantity'].value = product.quantity || 0
  form.elements['description'].value = product.description || ''

  // Xử lý ảnh
  const images = product.images || []
  window.globalImageUrls = [...images]
  document.getElementById('edit-product-images-urls').value = JSON.stringify(images)

  const preview = document.getElementById('edit-preview-container')
  preview.innerHTML = ''
  images.forEach((url) => {
    const img = document.createElement('img')
    img.src = url
    img.className = 'w-20 h-20 object-cover rounded-lg border shadow-sm'
    preview.appendChild(img)
  })

  // Hiện Modal với hiệu ứng mượt
  modal.classList.remove('hidden')
  document.body.style.overflow = 'hidden' // Chặn cuộn trang web bên dưới
}

// 2. Hàm Đóng Modal
function closeEditModal() {
  const modal = document.getElementById('edit-modal')
  modal.classList.add('hidden')
  document.body.style.overflow = 'auto' // Cho phép cuộn lại
  window.currentEditingId = null
}

// 3. Xử lý Submit Form Chỉnh Sửa
document.getElementById('edit-product-form').onsubmit = async function (e) {
  e.preventDefault()

  const formData = new FormData(this)
  const data = Object.fromEntries(formData.entries())

  data.price = Number(data.price)
  data.quantity = Number(data.quantity)
  data.images = window.globalImageUrls // Lấy từ mảng ảnh đã xử lý

  try {
    const res = await fetch(`/products/${window.currentEditingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('access_token')
      },
      body: JSON.stringify(data)
    })

    if (res.ok) {
      showToast('✅ Cập nhật sản phẩm thành công!', 'success')
      closeEditModal()
      loadAdminProducts() // Tải lại danh sách
    } else {
      const err = await res.json()
      showToast('❌ Lỗi: ' + err.message, 'error')
    }
  } catch (error) {
    showToast('❌ Lỗi kết nối server', 'error')
  }
}

function handlePriceInput(input) {
  // 1. Lấy giá trị, xóa bỏ mọi ký tự không phải số
  let rawValue = input.value.replace(/\D/g, '')

  // 2. Cập nhật giá trị số nguyên vào input ẩn để gửi lên server
  const rawInput = document.getElementById('price-raw')
  if (rawInput) rawInput.value = rawValue

  // 3. Định dạng hiển thị có dấu chấm (Kiểu Đức/Việt Nam dùng dấu chấm phân cách)
  if (rawValue !== '') {
    input.value = new Intl.NumberFormat('de-DE').format(rawValue)
  } else {
    input.value = ''
  }
}

// 1. Hàm hiện/ẩn ô nhập danh mục mới (Giữ nguyên của bạn)
function toggleNewCategoryInput() {
  const wrapper = document.getElementById('new-category-wrapper')
  wrapper.classList.toggle('hidden')
  if (!wrapper.classList.contains('hidden')) {
    document.getElementById('new-category-input').focus()
  }
}

// 2. Hàm thêm danh mục mới (Đã kết nối API MongoDB)
async function addNewCategory() {
  const input = document.getElementById('new-category-input')
  const name = input.value.trim()

  if (!name) return showToast('Vui lòng nhập tên danh mục!', 'error')

  try {
    // Gọi API TẠO danh mục lên Node.js
    const response = await fetch('/products/create-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name })
    })

    const data = await response.json()

    if (response.ok) {
      showToast('Đã thêm danh mục mới vào Database', 'success')
      input.value = ''
      toggleNewCategoryInput()

      // Gọi lại hàm load danh sách để thả xuống (Dropdown) tự cập nhật
      await loadCategoriesForDropdown()

      // Tự động chọn luôn danh mục vừa tạo (lấy _id thật từ MongoDB)
      const newId = data.result.insertedId || data.result._id
      selectOption(newId, name)
    } else {
      showToast('Lỗi: ' + data.message, 'error')
    }
  } catch (error) {
    console.error('Lỗi khi thêm danh mục:', error)
    showToast('Có lỗi xảy ra khi kết nối máy chủ', 'error')
  }
}

// 3. Hàm xóa danh mục (Đã kết nối API)
async function removeSelectedCategory() {
  const rawInput = document.getElementById('category-raw-value')
  const currentValue = rawInput.value // Đây chính là _id của danh mục

  if (!currentValue) return showToast('Vui lòng chọn danh mục để xóa!', 'error')

  if (confirm('Bạn có chắc chắn muốn xóa danh mục này khỏi Database?')) {
    try {
      // Gọi API XÓA danh mục (LƯU Ý: Bạn cần viết API này ở Backend)
      const response = await fetch(`/products/delete-categories/${currentValue}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Đã xóa danh mục thành công', 'success')

        // Reset lại giao diện hiển thị
        document.getElementById('selected-category').querySelector('span').innerText = 'Chọn danh mục'
        rawInput.value = ''

        // Tải lại danh sách dropdown mới nhất từ DB
        await loadCategoriesForDropdown()
      } else {
        const data = await response.json()
        showToast('Lỗi: ' + (data.message || 'Không thể xóa'), 'error')
      }
    } catch (error) {
      console.error('Lỗi khi xóa:', error)
      showToast('Có lỗi xảy ra khi kết nối máy chủ', 'error')
    }
  }
}

// Hàm gọi API lấy danh mục từ DB và đổ vào dropdown
async function loadCategoriesForDropdown() {
  const optionsListElement = document.getElementById('options-list')
  if (!optionsListElement) return

  try {
    // Gọi API lấy danh sách danh mục
    const response = await fetch('/products/get-categories')
    const data = await response.json()

    // Lấy mảng danh mục từ thuộc tính 'result'
    const categories = data.result

    let htmlContent = ''

    // Lặp qua từng danh mục từ Database và tạo HTML
    categories.forEach((cat) => {
      htmlContent += `
        <div
          class="option-item p-2 hover:bg-brown-50 cursor-pointer text-brown-800 transition rounded-md mx-1 my-0.5"
          data-value="${cat._id}"
          onclick="selectOption('${cat._id}', '${cat.name}')"
        >
          ${cat.name}
        </div>
      `
    })

    // Cập nhật lại danh sách trên màn hình
    optionsListElement.innerHTML = htmlContent
  } catch (error) {
    console.error('Lỗi khi tải danh mục cho dropdown:', error)
    optionsListElement.innerHTML = '<div class="p-2 text-red-500 text-sm">Lỗi tải dữ liệu</div>'
  }
}

// Đừng quên gọi hàm này 1 lần khi trang web vừa load xong nhé:
document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesForDropdown()
})

// 1. Đóng/Mở Dropdown
function toggleDropdown() {
  const options = document.getElementById('dropdown-options')
  const icon = document.getElementById('dropdown-icon')

  options.classList.toggle('hidden')
  icon.classList.toggle('rotate-180')
}

// 2. Chọn một Option
function selectOption(value, label) {
  // Hiển thị tên lên ô chọn
  document.getElementById('selected-category').querySelector('span').innerText = label
  document.getElementById('selected-category').querySelector('span').classList.add('text-brown-900')

  // Lưu giá trị vào input ẩn để gửi Backend
  document.getElementById('category-raw-value').value = value

  // Đóng dropdown
  toggleDropdown()
}

// 3. Đóng dropdown khi bấm ra ngoài vùng chọn
window.addEventListener('click', function (e) {
  const select = document.getElementById('category-custom-select')
  if (!select.contains(e.target)) {
    document.getElementById('dropdown-options').classList.add('hidden')
    document.getElementById('dropdown-icon').classList.remove('rotate-180')
  }
})
