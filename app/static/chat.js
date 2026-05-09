// API配置
const API_BASE_URL = '/api/v1';

// 全局状态
let currentSession = null;
let sessions = [];
let selectedImage = null;
let isStreaming = false;

// 初始化
window.addEventListener('load', async () => {
    checkAuth();
    await loadUserSessions();
    setupAutoResize();
});

// 检查认证
function checkAuth() {
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('username');
    
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // 显示用户信息
    document.getElementById('username').textContent = username || '用户';
    document.getElementById('userInitial').textContent = (username || 'U')[0].toUpperCase();
}

// 退出登录
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
}

// 获取认证头
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// 加载会话列表
async function loadUserSessions() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('加载会话失败');
        }
        
        sessions = await response.json();
        renderSessionList();
        
        // 如果有会话，选择第一个
        if (sessions.length > 0 && !currentSession) {
            selectSession(sessions[0]);
        }
    } catch (error) {
        console.error('加载会话失败:', error);
    }
}

// 渲染会话列表
function renderSessionList() {
    const sessionListEl = document.getElementById('sessionList');
    sessionListEl.innerHTML = '';
    
    sessions.forEach(session => {
        const sessionEl = document.createElement('div');
        sessionEl.className = `p-3 rounded-lg cursor-pointer transition-all ${
            currentSession && currentSession.thread_id === session.thread_id
                ? 'bg-orange-50 border-l-4 border-orange-500' 
                : 'hover:bg-gray-50'
        }`;
        sessionEl.onclick = () => selectSession(session);
        
        sessionEl.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">
                        ${session.title || '未命名会话'}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                        ${formatDate(session.created_at)}
                    </p>
                </div>
            </div>
        `;
        
        sessionListEl.appendChild(sessionEl);
    });
}

// 选择会话
async function selectSession(session) {
    currentSession = session;
    renderSessionList();
    await loadMessages(session.thread_id);
}

// 加载消息历史
async function loadMessages(threadId) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/messages?thread_id=${threadId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('加载消息失败');
        }
        
        const data = await response.json();
        renderMessages(data.messages);
    } catch (error) {
        console.error('加载消息失败:', error);
    }
}

// 渲染消息
function renderMessages(messages) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="flex justify-center">
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">开始新的对话</h2>
                    <p class="text-gray-600">上传食材图片或描述你有的食材，我会为你推荐美味食谱！</p>
                </div>
            </div>
        `;
        return;
    }
    
    messages.forEach(msg => {
        appendMessage(msg.role, msg.content);
    });
    
    scrollToBottom();
}

// 添加消息到界面
function appendMessage(role, content) {
    const container = document.getElementById('messageContainer');
    
    const messageEl = document.createElement('div');
    messageEl.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const bubbleEl = document.createElement('div');
    bubbleEl.className = `max-w-[70%] px-4 py-3 rounded-2xl ${
        role === 'user' 
            ? 'message-user text-white' 
            : 'message-assistant text-gray-800'
    }`;
    bubbleEl.textContent = content;
    
    messageEl.appendChild(bubbleEl);
    container.appendChild(messageEl);
    
    scrollToBottom();
}

// 创建新会话
async function createNewSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/session`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title: '新会话' })
        });
        
        if (!response.ok) {
            throw new Error('创建会话失败');
        }
        
        const newSession = await response.json();
        sessions.unshift(newSession);
        renderSessionList();
        selectSession(newSession);
        
        // 清空消息区域
        document.getElementById('messageContainer').innerHTML = '';
    } catch (error) {
        console.error('创建会话失败:', error);
        alert('创建会话失败，请重试');
    }
}

// 发送消息
async function sendMessage() {
    if (isStreaming) return;
    
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message && !selectedImage) return;
    
    if (!currentSession) {
        await createNewSession();
    }
    
    // 显示用户消息
    const displayMessage = selectedImage ? `[图片] ${message}` : message;
    appendMessage('user', displayMessage);
    
    // 清空输入
    input.value = '';
    input.style.height = 'auto';
    
    // 上传图片（如果有）
    let imageUrl = null;
    if (selectedImage) {
        try {
            imageUrl = await uploadImage(selectedImage);
            removeImage();
        } catch (error) {
            console.error('图片上传失败:', error);
            alert('图片上传失败，请重试');
            return;
        }
    }
    
    // 禁用发送按钮
    setSendingState(true);
    
    // 显示AI正在输入
    showTypingIndicator();
    
    try {
        // 流式请求
        await streamChat(message, currentSession.thread_id, imageUrl);
    } catch (error) {
        console.error('发送消息失败:', error);
        appendMessage('assistant', '抱歉，发生错误，请重试');
    } finally {
        hideTypingIndicator();
        setSendingState(false);
    }
}

// 流式对话
async function streamChat(message, threadId, imageUrl) {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            message,
            image_url: imageUrl,
            thread_id: threadId
        })
    });
    
    if (!response.ok) {
        throw new Error('对话请求失败');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let assistantMessage = '';
    
    // 创建AI消息气泡
    const container = document.getElementById('messageContainer');
    const messageEl = document.createElement('div');
    messageEl.className = 'flex justify-start';
    
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'max-w-[70%] px-4 py-3 rounded-2xl message-assistant text-gray-800';
    messageEl.appendChild(bubbleEl);
    container.appendChild(messageEl);
    
    while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const content = line.slice(6);
                if (content && content !== '[DONE]') {
                    assistantMessage += content;
                    bubbleEl.textContent = assistantMessage;
                    scrollToBottom();
                }
            }
        }
    }
}

// 上传图片到OSS
async function uploadImage(file) {
    // 1. 获取预签名URL
    const presignResponse = await fetch(`${API_BASE_URL}/oss/presign?filename=${file.name}`, {
        headers: getAuthHeaders()
    });
    
    if (!presignResponse.ok) {
        throw new Error('获取上传URL失败');
    }
    
    const presignData = await presignResponse.json();
    
    // 2. 上传到OSS
    const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': presignData.contentType
        }
    });
    
    if (!uploadResponse.ok) {
        throw new Error('图片上传失败');
    }
    
    // 3. 返回访问URL
    return presignData.accessUrl;
}

// 处理图片选择
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
    }
    
    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
    }
    
    selectedImage = file;
    
    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// 移除图片
function removeImage() {
    selectedImage = null;
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('imageInput').value = '';
}

// 显示正在输入指示器
function showTypingIndicator() {
    const container = document.getElementById('messageContainer');
    const typingEl = document.createElement('div');
    typingEl.id = 'typingIndicator';
    typingEl.className = 'flex justify-start';
    typingEl.innerHTML = `
        <div class="max-w-[70%] px-4 py-3 rounded-2xl message-assistant">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            </div>
        </div>
    `;
    container.appendChild(typingEl);
    scrollToBottom();
}

// 隐藏正在输入指示器
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// 设置发送状态
function setSendingState(sending) {
    isStreaming = sending;
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    
    sendButton.disabled = sending;
    messageInput.disabled = sending;
}

// 自动调整文本框高度
function setupAutoResize() {
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
}

// 处理键盘事件
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// 滚动到底部
function scrollToBottom() {
    const container = document.getElementById('messageContainer');
    container.scrollTop = container.scrollHeight;
}

// 切换侧边栏（移动端）
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // 小于1分钟
    if (diff < 60000) {
        return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    }
    // 小于24小时
    if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
    }
    // 小于7天
    if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}天前`;
    }
    
    return date.toLocaleDateString('zh-CN');
}
