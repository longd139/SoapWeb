// 1. Khởi tạo AOS
AOS.init({
  once: true,
  offset: 100,
  duration: 1000
})

document.addEventListener('DOMContentLoaded', updateCartBadge)
// 2. Hàm load sản phẩm

// Đảm bảo hàm này nằm ngoài tất cả các hàm khác để có thể gọi ở bất cứ đâu
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container')
  if (!container) return

  const toast = document.createElement('div')
  const isSuccess = type === 'success'
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500'
  const icon = isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'

  // Thiết lập class cho Toast
  toast.className = `flex items-center gap-3 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-500 translate-x-full opacity-0 pointer-events-auto`

  toast.innerHTML = `
    <i class="fas ${icon} text-xl"></i>
    <span class="font-bold text-sm">${message}</span>
  `

  container.appendChild(toast)

  // Hiệu ứng trượt vào: Cần một chút delay để trình duyệt nhận biết sự thay đổi class
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0')
  }, 100)

  // Tự động biến mất sau 3 giây
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0')
    setTimeout(() => toast.remove(), 500)
  }, 3000)
}
async function loadProducts() {
  const grid = document.getElementById('product-grid')
  const searchInput = document.getElementById('global-search-input')

  // 1. Lấy từ khóa từ URL (Ví dụ: ?search=caphe)
  const urlParams = new URLSearchParams(window.location.search)
  const searchKeyword = urlParams.get('search')

  // 2. Nếu có từ khóa -> Điền lại vào ô input để người dùng thấy
  const titleElement = document.getElementById('page-title')
  if (titleElement) {
    if (searchKeyword) {
      // Nếu có tìm kiếm -> Hiện từ khóa
      titleElement.innerText = `Kết quả tìm kiếm: "${searchKeyword}"`
    } else {
      // Nếu không -> Hiện mặc định
      titleElement.innerText = 'Tất cả sản phẩm'
    }
  }
  if (searchKeyword && searchInput) {
    searchInput.value = searchKeyword
  }
  try {
    let apiUrl = '/products/list-all?'
    const urlParams = new URLSearchParams(window.location.search)
    const searchKeyword = urlParams.get('search')
    const maxPrice = urlParams.get('maxPrice')

    // Ghép các điều kiện lọc lại với nhau
    const params = new URLSearchParams()
    if (searchKeyword) params.append('search', searchKeyword)
    if (maxPrice) params.append('maxPrice', maxPrice)

    // API URL hoàn chỉnh sẽ giống như: /products/list?search=caphe&maxPrice=500000
    apiUrl += params.toString()

    const response = await fetch(apiUrl)
    const data = await response.json()
    const products = data.result || []

    // Nếu không có sản phẩm nào
    if (products.length === 0) {
      grid.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <p class="text-wood-800/60 italic">
                        Không tìm thấy sản phẩm nào với từ khóa "${searchKeyword || ''}"
                    </p>
                    <a href="/products" class="text-wood-500 hover:underline mt-2 inline-block">Xem tất cả sản phẩm</a>
                </div>
            `
      return
    }

    // Render HTML (Copy y nguyên mẫu HTML của bạn vào đây)
    const html = products
      .map((product) => {
        // Format tiền tệ Việt Nam (Ví dụ: 1.200.000 ₫)
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)

        // Xử lý mô tả ngắn gọn (nếu dài quá thì cắt bớt)
        const shortDesc = product.description
          ? product.description.length > 50
            ? product.description.substring(0, 50) + '...'
            : product.description
          : 'Sản phẩm chất lượng từ Emee Care'

        return `
    <div class="group bg-white rounded-lg shadow-sm hover:shadow-xl transition duration-300 overflow-hidden relative"
         data-aos="fade-up"
         data-aos-duration="1000">
      
      <!-- Nút yêu thích -->
      <div class="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-wood-500 hover:text-white transition text-wood-800/40">
        <i class="far fa-heart"></i>
      </div>

      <!-- Hình ảnh sản phẩm -->
      <div class="relative overflow-hidden aspect-[4/5] bg-wood-200/20">
        <img
          src="${product.images}"
          alt="${product.name}"
          onerror="this.src='https://via.placeholder.com/400x500?text=No+Image'" 
          class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
        />

        <!-- Nút Thêm vào giỏ (Hover hiện lên) -->
        <div class="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition duration-300">
          <button 
        onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.images}')"
        class="w-full bg-wood-800 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-wood-500 shadow-lg"
      >
        Thêm vào giỏ
      </button>
        </div>
      </div>

      <!-- Thông tin sản phẩm -->
      <div class="p-4 text-center">
        <h3 class="text-lg font-bold text-wood-800 mb-1 group-hover:text-wood-500 transition line-clamp-1">
          ${product.name}
        </h3>
        <p class="text-xs text-wood-800/50 mb-3 line-clamp-1">${shortDesc}</p>
        <span class="text-wood-800 font-bold text-lg">${price}</span>
      </div>
    </div>
  `
      })
      .join('')

    // Đổ HTML vào khung
    grid.innerHTML = html

    // ⚠️ QUAN TRỌNG: Làm mới AOS để nhận diện các phần tử vừa thêm vào
    setTimeout(() => {
      AOS.refresh()
    }, 100)
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error)
    grid.innerHTML = `<div class="col-span-full text-center text-red-500">Không thể tải sản phẩm. Vui lòng thử lại sau.</div>`
  }
}

function addToCart(productId, productName, productPrice, productImage) {
  // 1. Lấy giỏ hàng hiện tại từ sessionStorage (nếu chưa có thì tạo mảng rỗng)
  let cart = JSON.parse(sessionStorage.getItem('cart')) || []

  // 2. Kiểm tra xem sản phẩm đã có trong giỏ chưa
  const itemIndex = cart.findIndex((item) => item.id === productId)

  if (itemIndex > -1) {
    // Nếu có rồi thì tăng số lượng
    cart[itemIndex].quantity += 1
  } else {
    // Nếu chưa có thì thêm mới object sản phẩm
    cart.push({
      id: productId,
      name: productName,
      price: productPrice,
      image: productImage,
      quantity: 1
    })
  }

  // 3. Lưu lại vào sessionStorage
  sessionStorage.setItem('cart', JSON.stringify(cart))

  // 4. Cập nhật con số trên icon túi xách
  updateCartBadge()

  // Thông báo nhẹ cho người dùng
  showToast(`Đã thêm "${productName}" vào giỏ hàng!`, 'success')
}

function updateCartBadge() {
  const cart = JSON.parse(sessionStorage.getItem('cart')) || []
  // Tính tổng số lượng (quantity) của tất cả sản phẩm
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  const badge = document.getElementById('cart-count')
  if (badge) {
    badge.innerText = totalItems
    // Ẩn badge nếu giỏ hàng trống (tùy chọn)
    badge.style.display = totalItems > 0 ? 'flex' : 'none'
  }
}

// Hàm tải danh mục từ Backend
// Hàm gọi API lấy danh mục và đổ vào dropdown
async function loadCategoriesForDropdown() {
  const optionsListElement = document.getElementById('options-list')
  if (!optionsListElement) return

  try {
    // Gọi API bằng đường link chính xác của bạn
    const response = await fetch('/products/get-categories')
    const data = await response.json()

    // Lấy mảng danh mục từ thuộc tính 'result' trong controller của bạn
    const categories = data.result

    let htmlContent = ''

    // Lặp qua từng danh mục từ Database và tạo thẻ div
    categories.forEach((cat) => {
      // cat._id là ID từ MongoDB, cat.name là tên danh mục
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

    // Nhét tất cả vào thẻ list
    optionsListElement.innerHTML = htmlContent
  } catch (error) {
    console.error('Lỗi khi tải danh mục cho dropdown:', error)
    optionsListElement.innerHTML = '<div class="p-2 text-red-500 text-sm">Lỗi tải dữ liệu</div>'
  }
}

// Chạy hàm này khi load trang
document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesForDropdown()
})
// Chạy hàm khi trang web tải xong
document.addEventListener('DOMContentLoaded', loadProducts)

// Hàm tải danh mục từ Backend để hiển thị ở cột Filter (Trang Sản phẩm)
async function loadCategoriesForFilter() {
  const categoryListElement = document.getElementById('category-filter-list')
  if (!categoryListElement) return

  try {
    // 1. Sửa lại đường link cho khớp 100% với API của bạn
    const response = await fetch('/products/get-categories')
    const data = await response.json()

    if (response.ok) {
      const categories = data.result
      let htmlContent = ''

      // Kiểm tra xem khách hàng có đang bấm vào danh mục nào không (trên URL)
      const urlParams = new URLSearchParams(window.location.search)
      const activeCategory = urlParams.get('category')

      // 2. Quét qua mảng danh mục và tạo HTML
      categories.forEach((cat) => {
        const isActive = activeCategory === cat._id

        // Đổi màu nếu danh mục đang được chọn
        const textClass = isActive ? 'text-wood-500 font-bold' : 'text-wood-800/70 hover:text-wood-500 transition'

        const badgeClass = isActive ? 'bg-wood-500 text-white' : 'bg-wood-200 text-wood-800'

        // Tạm thời hiển thị số 0 nếu Backend của bạn chưa có hàm đếm số lượng sản phẩm
        const productCount = cat.productCount || 0

        htmlContent += `
          <li>
            <a href="/products?category=${cat._id}" class="${textClass} flex justify-between items-center">
              ${cat.name} 
              <span class="text-xs ${badgeClass} px-2 py-0.5 rounded-full">${productCount}</span>
            </a>
          </li>
        `
      })

      // Nhét toàn bộ HTML vào danh sách
      categoryListElement.innerHTML = htmlContent
    } else {
      categoryListElement.innerHTML = `<li class="text-red-500 text-xs">Lỗi: ${data.message}</li>`
    }
  } catch (error) {
    console.error('Lỗi khi tải danh mục filter:', error)
    categoryListElement.innerHTML = '<li class="text-red-500 text-xs">Không thể kết nối máy chủ.</li>'
  }
}

// Chạy hàm này ngay khi khách hàng vừa vào trang Sản phẩm
document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesForFilter()
})

// Hàm 1: Chạy liên tục khi bạn đang kéo thanh trượt (để số tiền nhảy theo realtime)
function updatePriceDisplay(value) {
  // Format lại thành tiền Việt: 500000 -> 500.000 ₫
  const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  document.getElementById('current-price-display').innerText = formattedPrice
}

// Hàm 2: Chỉ chạy khi bạn "buông chuột" ra khỏi thanh trượt -> Bắt đầu lọc
function triggerPriceFilter(value) {
  const url = new URL(window.location.href)

  // Gắn mức giá vừa chọn lên thanh địa chỉ URL (ví dụ: ?maxPrice=500000)
  url.searchParams.set('maxPrice', value)
  window.history.pushState({}, '', url)

  // Gọi lại hàm loadProducts() để lấy sản phẩm mới từ DB
  loadProducts()
}

// Hàm bổ sung: Giữ nguyên mức giá trên thanh trượt khi F5 lại trang
document.addEventListener('DOMContentLoaded', () => {
  const priceInput = document.getElementById('price-range')
  if (priceInput) {
    const urlParams = new URLSearchParams(window.location.search)
    const maxPrice = urlParams.get('maxPrice')

    if (maxPrice) {
      priceInput.value = maxPrice
      updatePriceDisplay(maxPrice)
    }
  }
})
