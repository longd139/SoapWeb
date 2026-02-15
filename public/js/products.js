// 1. Khởi tạo AOS (Giữ nguyên cấu hình của bạn)
AOS.init({
  once: true,
  offset: 100,
  duration: 1000
})

// 2. Hàm load sản phẩm
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
            <div
              class="group bg-white rounded-lg shadow-sm hover:shadow-xl transition duration-300 overflow-hidden relative"
              data-aos="fade-up"
              data-aos-duration="1000"
            >
              <div
                class="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-wood-500 hover:text-white transition text-wood-800/40"
              >
                <i class="far fa-heart"></i>
              </div>

              <div class="relative overflow-hidden aspect-[4/5] bg-wood-200/20">
                <img
                  src="${product.image}"
                  alt="${product.name}"
                  onerror="this.src='https://via.placeholder.com/400x500?text=No+Image'" 
                  class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div
                  class="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition duration-300"
                >
                  <button
                    class="w-full bg-wood-800 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-wood-500 shadow-lg"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>

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

// Chạy hàm khi trang web tải xong
document.addEventListener('DOMContentLoaded', loadProducts)
