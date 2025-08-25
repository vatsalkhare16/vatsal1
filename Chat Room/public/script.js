// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Socket.IO with auth token
const token = localStorage.getItem('supabase.auth.token');
if (!token) {
  window.location.href = '/auth.html';
}

const socket = io({
  auth: {
    token: token
  }
});

const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const usernamePopup = document.getElementById('username-popup');
const usernameInput = document.getElementById('username-input');
const usernameSubmit = document.getElementById('username-submit');
const chatContainer = document.getElementById('chat-container');
const userList = document.getElementById('user-list');
const welcomeScreen = document.getElementById('welcome-screen');
const clearChatButton = document.getElementById('clear-chat');

let currentChat = null;
let username = '';  
let currentUserId = null;

// Initialize Supabase client
const supabase = createClient(
  'https://cyporxvxzrzgshiajtvi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cG9yeHZ4enJ6Z3NoaWFqdHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzU0NDYsImV4cCI6MjA2MDk1MTQ0Nn0.tcOAK6bHQ15pVDn0KGWTXcCyARHMvhlHnG6HSbzgaqE'
);

// User Profile Management
let currentUser = null;

// Generate a random color for the avatar
function getRandomColor() {
    const colors = [
        '#0088cc', '#00a2ff', '#4CAF50', '#2196F3', 
        '#9C27B0', '#E91E63', '#FF5722', '#795548'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Generate a default avatar URL
function generateDefaultAvatar(name) {
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
    const color = getRandomColor();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color.substring(1)}&color=fff&size=200`;
}

async function loadUserProfile() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        // Get user profile from users table
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, email, username')
            .eq('id', user.id)
            .single();

        if (profileError) throw profileError;

        // Generate default avatar
        const defaultAvatar = generateDefaultAvatar(profile.username || user.email);

        // Initialize currentUser with both auth and profile data
        currentUser = {
            ...user,
            ...profile,
            avatar: defaultAvatar,
            username: profile.username || user.email
        };

        // Update UI with user data
        updateUserProfile(currentUser);
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Set default values if profile loading fails
        currentUser = {
            email: 'Loading...',
            username: 'Loading...',
            avatar: generateDefaultAvatar('User')
        };
        updateUserProfile(currentUser);
    }
}

function updateUserProfile(user) {
    if (!user) return;
    
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');

    if (userAvatar) userAvatar.src = user.avatar;
    if (userName) userName.textContent = user.username || user.email;
    if (userEmail) userEmail.textContent = user.email;
}

function showProfilePopup() {
    if (!currentUser) return;
    
    const popup = document.getElementById('profile-popup');
    const avatar = document.getElementById('profile-avatar');
    const username = document.getElementById('profile-username');
    const email = document.getElementById('profile-email');

    if (popup) popup.style.display = 'flex';
    if (avatar) avatar.src = currentUser.avatar;
    if (username) username.value = currentUser.username || '';
    if (email) {
        email.value = currentUser.email;
        email.disabled = true;
    }
}

function closeProfilePopup() {
    const popup = document.getElementById('profile-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

function updateProfile() {
    const username = document.getElementById('profile-username').value;
    const email = document.getElementById('profile-email').value;

    if (!username.trim()) {
        alert('Username cannot be empty');
        return;
    }

    // Here you would typically make an API call to update the user's profile
    // For now, we'll just update the UI
    currentUser.username = username;
    updateUserProfile(currentUser);
    closeProfilePopup();
}

async function logout() {
    try {
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // Clear local storage
        localStorage.removeItem('supabase.auth.token');
        
        // Clear current user data
        currentUser = null;
        
        // Redirect to login page
        window.location.href = '/auth.html';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Failed to logout. Please try again.');
    }
}

// Initialize profile popup
document.addEventListener('DOMContentLoaded', function() {
    // Hide profile popup by default
    const profilePopup = document.getElementById('profile-popup');
    if (profilePopup) {
        profilePopup.style.display = 'none';
    }

    // Add event listeners for profile popup
    const editProfileBtn = document.getElementById('edit-profile');
    const closeProfileBtn = document.getElementById('close-profile');
    const saveProfileBtn = document.getElementById('save-profile');
    const cancelProfileBtn = document.getElementById('cancel-profile');
    const logoutButton = document.getElementById('logout-button');

    if (editProfileBtn) editProfileBtn.addEventListener('click', showProfilePopup);
    if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeProfilePopup);
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', updateProfile);
    if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', closeProfilePopup);
    if (logoutButton) logoutButton.addEventListener('click', logout);
});

// Clear chat function
async function clearChat() {
  if (!currentChat) return;

  if (confirm('Are you sure you want to clear this chat? This will delete all messages.')) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .or(`sender_id.eq.${currentChat},receiver_id.eq.${currentChat}`);

      if (error) throw error;

      // Clear messages from the UI
      messagesContainer.innerHTML = '';
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.classList.add('system-message');
      successMessage.textContent = 'Chat cleared successfully';
      messagesContainer.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat. Please try again.');
    }
  }
}

// Add clear chat button event listener
clearChatButton.addEventListener('click', clearChat);

// Load user profile on page load
window.onload = async function() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        currentUserId = user.id;
        
        // Load user profile first
        await loadUserProfile();
        
        // Check if username is set
        if (!currentUser.username || currentUser.username === user.email) {
            usernamePopup.style.display = 'flex';
            welcomeScreen.style.display = 'none';
        } else {
            usernamePopup.style.display = 'none';
            welcomeScreen.style.display = 'flex';
        }
        
        // Then load online users
        await fetchOnlineUsers();
    } catch (error) {
        console.error('Error loading user:', error);
        window.location.href = '/auth.html';
    }
};

// Handle username submission
usernameSubmit.addEventListener('click', async function() {
  const newUsername = usernameInput.value.trim();
  if (newUsername) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: newUsername }
      });
      if (error) throw error;
      
      username = newUsername;
        usernamePopup.style.display = 'none';  
      welcomeScreen.style.display = 'flex';
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Failed to update username. Please try again.');
    }
    } else {
        alert('Please enter a username!');
    }
});

// Send message function
async function sendMessage() {
  if (!currentChat) {
    alert('Please select a user to chat with first!');
    return;
  }

    const message = messageInput.value.trim();
  if (message) {
    try {
      // Disable input while sending
      messageInput.disabled = true;
      sendButton.disabled = true;

      // Send message
      socket.emit('privateMessage', {
        content: message,
        receiverId: currentChat
      });
      
      // Clear input
        messageInput.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      // Re-enable input
      messageInput.disabled = false;
      sendButton.disabled = false;
      messageInput.focus();
    }
  }
}

// Event listeners for sending messages
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); 
        sendMessage(); 
    }
});

// Socket event handlers
socket.on('messageSent', async (message) => {
  // Fetch sender's username
  const { data: sender } = await supabase
    .from('users')
    .select('username')
    .eq('id', message.sender_id)
    .single();
  
  appendMessage(message.content, 'sent', sender.username);
});

socket.on('newPrivateMessage', async (message) => {
  // Fetch sender's username
  const { data: sender } = await supabase
    .from('users')
    .select('username')
    .eq('id', message.sender_id)
    .single();
  
  appendMessage(message.content, 'received', sender.username);
});

socket.on('userList', (users) => {
  userList.innerHTML = users.map(user => {
    const avatar = generateDefaultAvatar(user.username || user.email);
    const displayName = user.username || user.email;
    return `
      <li data-user-id="${user.id}" onclick="startPrivateChat('${user.id}')" class="${user.id === currentChat ? 'active' : ''}">
        <div class="user-list-item">
          <div class="user-avatar">
            <img src="${avatar}" alt="${displayName}">
            <span class="status-indicator"></span>
          </div>
          <span class="user-name">${displayName}</span>
        </div>
      </li>
    `;
  }).join('');
});

socket.on('error', ({ message, details }) => {
  console.error('Socket error:', { message, details });
  if (details) {
    console.error('Error details:', details);
  }
  alert(message);
});

// Message display function
function appendMessage(content, type, username) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', type);
  
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageElement.innerHTML = `
    <div class="message-header">
      <strong>${type === 'sent' ? 'You' : username}</strong>
      <span class="timestamp">${timestamp}</span>
    </div>
    <div class="message-content">${content}</div>
  `;
  
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fetch online users
async function fetchOnlineUsers() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { data, error } = await supabase
            .from('users')
            .select('id, email, username')
            .neq('id', user.id); // Exclude current user
  
        if (error) throw error;
        
        userList.innerHTML = data.map(user => {
            const avatar = generateDefaultAvatar(user.username || user.email);
            const displayName = user.username || user.email;
            return `
                <li data-user-id="${user.id}" onclick="startPrivateChat('${user.id}')" class="${user.id === currentChat ? 'active' : ''}">
                    <div class="user-list-item">
                        <div class="user-avatar">
                            <img src="${avatar}" alt="${displayName}">
                            <span class="status-indicator"></span>
                        </div>
                        <span class="user-name">${displayName}</span>
                    </div>
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Make startPrivateChat globally available
window.startPrivateChat = async function(userId) {
    currentChat = userId;
  
    // Update active user in the list
    document.querySelectorAll('#user-list li').forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('data-user-id') === userId) {
            li.classList.add('active');
        }
    });
  
    // Show chat container and hide welcome screen
    chatContainer.style.display = 'flex';
    chatContainer.classList.add('active');
    welcomeScreen.style.display = 'none';
  
    // Load chat history
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!sender_id(username),
                receiver:users!receiver_id(username)
            `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: true });
    
        if (error) throw error;
    
        // Clear existing messages
        messagesContainer.innerHTML = '';
    
        // Display messages
        messages.forEach(msg => {
            const isSent = msg.sender_id === currentUserId;
            const displayName = isSent ? 'You' : (msg.sender.username || msg.sender.email);
            appendMessage(
                msg.content,
                isSent ? 'sent' : 'received',
                displayName
            );
        });
    } catch (error) {
        console.error('Error loading messages:', error);
        alert('Failed to load chat history. Please try again.');
    }
};

// Add back button event listener
document.getElementById('back-button').addEventListener('click', function() {
    chatContainer.classList.remove('active');
    setTimeout(() => {
        chatContainer.style.display = 'none';
        welcomeScreen.style.display = 'flex';
    }, 300); // Match the transition duration
});