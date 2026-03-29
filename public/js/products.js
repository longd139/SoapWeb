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
    let apiUrl = '/products/list'
    if (searchKeyword) {
      apiUrl += `?search=${encodeURIComponent(searchKeyword)}`
    }

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

// Chạy hàm khi trang web tải xong
document.addEventListener('DOMContentLoaded', loadProducts)
