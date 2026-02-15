AOS.init({
  once: true, // Hiệu ứng chỉ chạy 1 lần khi cuộn xuống (không chạy lại khi cuộn lên)
  offset: 100 // Cách mép dưới màn hình 100px thì bắt đầu hiện
})

// 1. Hàm Bật/Tắt Modal chung (kết nối với nút trên Menu)
function toggleAuthModal() {
  const modal = document.getElementById('auth-modal')
  modal.classList.toggle('hidden')

  // Mặc định mỗi khi mở lên thì luôn hiện form Login trước
  if (!modal.classList.contains('hidden')) {
    switchToLogin()
  }
}

// 2. Hàm chuyển sang Đăng Ký
function switchToRegister() {
  document.getElementById('login-form').classList.add('hidden') // Ẩn Login
  document.getElementById('register-form').classList.remove('hidden') // Hiện Register
  document.getElementById('modal-title').innerText = 'ĐĂNG KÝ TÀI KHOẢN' // Đổi tiêu đề
  document.getElementById('modal-title').classList.replace('text-[#4A3B32]', 'text-[#855E42]') // Đổi màu tiêu đề cho khác biệt xíu
}

// 3. Hàm chuyển về Đăng Nhập
function switchToLogin() {
  document.getElementById('register-form').classList.add('hidden') // Ẩn Register
  document.getElementById('login-form').classList.remove('hidden') // Hiện Login
  document.getElementById('modal-title').innerText = 'ĐĂNG NHẬP' // Đổi tiêu đề cũ
  document.getElementById('modal-title').classList.replace('text-[#855E42]', 'text-[#4A3B32]')
}

function showFormMessage(message, isSuccess) {
  const el = document.getElementById('form-message')
  el.textContent = message

  if (isSuccess) {
    el.style.color = 'green'
  } else {
    el.style.color = 'red'
  }
}
function clearErrors() {
  // Chỉ xóa lỗi trong form đăng ký
  const inputs = document.querySelectorAll('#register-form input')
  inputs.forEach((input) => {
    input.style.removeProperty('border-color')
    input.style.removeProperty('background-color')
  })

  const errorMessages = document.querySelectorAll('#register-form .error-message')
  errorMessages.forEach((msg) => msg.remove())
}

function showInputError(inputName, message) {
  // 🔍 SỬA QUAN TRỌNG: Chỉ tìm input nằm trong #register-form
  const input = document.querySelector(`#register-form [name="${inputName}"]`)

  if (!input) {
    console.error('Không tìm thấy input: ' + inputName)
    return
  }

  // 1. Ép màu đỏ (Dùng setProperty important để đè tất cả style khác)
  input.style.setProperty('border-color', '#ef4444', 'important') // Đỏ rực
  input.style.setProperty('background-color', '#fef2f2', 'important') // Nền hồng nhạt

  // 2. Hiển thị chữ lỗi
  let errorText = input.parentNode.querySelector('.error-message')
  if (!errorText) {
    errorText = document.createElement('p')
    errorText.className = 'text-red-500 text-xs mt-1 italic error-message font-bold'
    input.parentNode.insertBefore(errorText, input.nextSibling)
  }
  errorText.innerText = message

  // 3. Focus vào ô lỗi
  input.focus()
}
document.getElementById('register-form').addEventListener('submit', async function (e) {
  e.preventDefault()
  clearErrors()
  showFormMessage('', true)

  const formData = new FormData(this)
  const data = Object.fromEntries(formData.entries())

  try {
    const response = await fetch('/user/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (response.ok) {
      //   showFormMessage('Đăng ký thành công!', true)
      this.reset()
      showSuccessPopupAndRedirect()
    } else {
      if (result.errors) {
        Object.keys(result.errors).forEach((key) => {
          showInputError(key, result.errors[key])
        })
        showFormMessage('Vui lòng kiểm tra lại thông tin.', false)
      } else {
        showFormMessage(result.message || 'Đăng ký thất bại.', false)
      }
    }
  } catch (error) {
    showFormMessage('Không thể kết nối đến server.', false)
  }
})

// xử lý mật khẩu
function validateStrongPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,50}$/
  return regex.test(password)
}

function clearInputError(inputName) {
  const input = document.querySelector(`#register-form [name="${inputName}"]`)
  if (!input) return

  input.style.removeProperty('border-color')
  input.style.removeProperty('background-color')

  const errorText = input.parentNode.querySelector('.error-message')
  if (errorText) errorText.remove()
}

const passwordInput = document.querySelector('#register-form [name="password"]')
const confirmInput = document.querySelector('#register-form [name="confirm_password"]')

passwordInput.addEventListener('input', function () {
  if (this.value === '') {
    clearInputError('password')
    return
  }

  if (!validateStrongPassword(this.value)) {
    showInputError('password', 'Mật khẩu 8-50 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt')
  } else {
    clearInputError('password')
  }
})

confirmInput.addEventListener('input', function () {
  if (this.value === '') {
    clearInputError('confirm_password')
    return
  }

  if (this.value !== passwordInput.value) {
    showInputError('confirm_password', 'Mật khẩu nhập lại không khớp')
  } else {
    clearInputError('confirm_password')
  }
})

function showSuccessPopupAndRedirect() {
  const popup = document.getElementById('success-popup')

  popup.classList.remove('hidden')

  setTimeout(() => {
    popup.classList.add('hidden')
    switchToLogin()
  }, 2000) // 2 giây
}

const USER_ROLE = {
  Admin: 0,
  Staff: 1,
  User: 2
}

// 2. Hàm điều hướng
function redirectByRole(role) {
  // Ép kiểu sang số để so sánh cho chuẩn (tránh trường hợp server trả về string "0")
  const roleNumber = Number(role)

  switch (roleNumber) {
    case USER_ROLE.Admin: // 0
      console.log('👑 Xin chào Sếp! Đang vào trang Admin...')
      window.location.href = '/admin'
      break

    case USER_ROLE.Staff: // 1
      console.log('🛠️ Xin chào Nhân viên! Đang vào trang làm việc...')
      window.location.href = '/staff/orders'
      break

    case USER_ROLE.User: // 2
      console.log('🛒 Xin chào Khách hàng! Đang về trang chủ...')
      window.location.href = '/'
      break

    default:
      console.warn('⚠️ Role không xác định:', role)
      window.location.href = '/'
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form')

  // 1. Lấy thẻ hiển thị lỗi
  const errorElement = document.getElementById('login-error')

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault()

      // 2. RESET TRẠNG THÁI: Mỗi lần bấm nút là ẩn lỗi cũ đi trước
      if (errorElement) {
        errorElement.textContent = ''
        errorElement.classList.add('hidden')
      }

      const formData = new FormData(this)
      // Lưu ý: Dòng này chuyển FormData thành JSON object
      // Nếu key trong form name="email" thì object sẽ có key là email
      const data = Object.fromEntries(formData.entries())

      try {
        // Gửi request đăng nhập
        const response = await fetch('/user/login', {
          // Kiểm tra lại đúng đường dẫn API chưa nhé
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        const result = await response.json()

        if (response.ok) {
          // === ĐĂNG NHẬP THÀNH CÔNG ===
          localStorage.setItem('access_token', result.result.access_token)
          localStorage.setItem('refresh_token', result.result.refresh_token)
          localStorage.setItem('user_profile', JSON.stringify(result.result.user))

          // Có thể bỏ alert thành công nếu muốn chuyển trang luôn cho nhanh
          // alert('✅ Đăng nhập thành công!')

          const userRole = result.result.role // Lưu ý: Lấy từ user.role hay result.role tùy API trả về
          redirectByRole(userRole)
        } else {
          // === ❌ XỬ LÝ LỖI (Thay alert bằng text đỏ) ===
          if (errorElement) {
            // Lấy message từ server hoặc dùng câu mặc định
            const message = result.message || 'Email hoặc mật khẩu không đúng'

            // Gán nội dung và hiện thẻ lên
            errorElement.textContent = '⚠️ ' + message
            errorElement.classList.remove('hidden')
          }
        }
      } catch (error) {
        console.error('Lỗi login:', error)
        // === ⚠️ LỖI MẠNG/SERVER ===
        if (errorElement) {
          errorElement.textContent = '❌ Không thể kết nối đến Server, vui lòng thử lại sau.'
          errorElement.classList.remove('hidden')
        }
      }
    })
  }
})

// 1. Hàm xử lý khi bấm phím (Bắt sự kiện Enter)
function handleGlobalSearch(event) {
  if (event.key === 'Enter') {
    executeSearch()
  }
}

// 2. Hàm thực thi tìm kiếm (Chuyển trang)
function executeSearch() {
  const keyword = document.getElementById('global-search-input').value.trim()

  if (keyword) {
    // Chuyển hướng sang trang sản phẩm với tham số ?search=...
    // encodeURIComponent giúp xử lý các ký tự đặc biệt hoặc tiếng Việt
    window.location.href = `/products?search=${encodeURIComponent(keyword)}`
  }
}
