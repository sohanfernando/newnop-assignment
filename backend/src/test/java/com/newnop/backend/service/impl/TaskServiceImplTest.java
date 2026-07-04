package com.newnop.backend.service.impl;

import com.newnop.backend.dtos.request.TaskRequest;
import com.newnop.backend.dtos.response.TaskResponse;
import com.newnop.backend.entity.Task;
import com.newnop.backend.entity.User;
import com.newnop.backend.enums.Role;
import com.newnop.backend.enums.TaskStatus;
import com.newnop.backend.repository.TaskRepository;
import com.newnop.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private TaskServiceImpl taskService;

    private User owner;
    private User otherUser;
    private User admin;

    @BeforeEach
    void setUp() {
        taskService = new TaskServiceImpl(taskRepository, userRepository, messagingTemplate);

        owner = User.builder().id(1L).username("owner").email("owner@example.com").role(Role.USER).build();
        otherUser = User.builder().id(2L).username("other").email("other@example.com").role(Role.USER).build();
        admin = User.builder().id(99L).username("admin").email("admin@example.com").role(Role.ADMIN).build();
    }

    private Task existingTask(User taskOwner) {
        return Task.builder()
                .id(10L)
                .title("Existing task")
                .description("desc")
                .status(TaskStatus.TODO)
                .dueDate(LocalDate.now().plusDays(1))
                .owner(taskOwner)
                .build();
    }

    @Test
    void createTask_defaultsStatusToTodo_andBroadcastsOverWebSocket() {
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(5L);
            return t;
        });

        TaskRequest request = new TaskRequest();
        request.setTitle("New task");
        request.setDescription("Do the thing");
        request.setDueDate(LocalDate.now().plusDays(3));

        TaskResponse response = taskService.createTask(request, "owner@example.com");

        assertThat(response.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(response.getOwnerId()).isEqualTo(1L);

        ArgumentCaptor<Object> broadcastCaptor = ArgumentCaptor.forClass(Object.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/tasks"), broadcastCaptor.capture());
        assertThat(broadcastCaptor.getValue()).isInstanceOf(TaskResponse.class);
    }

    @Test
    void getTaskById_asOwner_succeeds() {
        Task task = existingTask(owner);
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.getTaskById(10L, "owner@example.com");

        assertThat(response.getId()).isEqualTo(10L);
    }

    @Test
    void getTaskById_asNonOwnerNonAdmin_throwsAccessDenied() {
        Task task = existingTask(owner);
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> taskService.getTaskById(10L, "other@example.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getTaskById_asAdmin_canViewAnyUsersTask() {
        Task task = existingTask(owner);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.getTaskById(10L, "admin@example.com");

        assertThat(response.getId()).isEqualTo(10L);
    }

    @Test
    void getAllTasks_asRegularUser_isScopedToOwnTasksRegardlessOfRequestedOwnerId() {
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        Pageable pageable = PageRequest.of(0, 10);
        Page<Task> page = new PageImpl<>(List.of(existingTask(owner)));
        when(taskRepository.findWithFilters(eq(null), eq(1L), eq(pageable))).thenReturn(page);

        // user requests ownerId=999 (someone else's), service must ignore that and force their own id
        Page<TaskResponse> result = taskService.getAllTasks(null, 999L, pageable, "owner@example.com");

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(taskRepository).findWithFilters(eq(null), eq(1L), eq(pageable));
    }

    @Test
    void getAllTasks_asAdmin_usesRequestedOwnerIdFilter() {
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        Pageable pageable = PageRequest.of(0, 10);
        Page<Task> page = new PageImpl<>(List.of(existingTask(owner)));
        when(taskRepository.findWithFilters(eq(TaskStatus.DONE), eq(1L), eq(pageable))).thenReturn(page);

        Page<TaskResponse> result = taskService.getAllTasks(TaskStatus.DONE, 1L, pageable, "admin@example.com");

        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(taskRepository).findWithFilters(eq(TaskStatus.DONE), eq(1L), eq(pageable));
    }

    @Test
    void updateTask_asNonOwnerNonAdmin_throwsAccessDenied_andDoesNotSaveOrBroadcast() {
        Task task = existingTask(owner);
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        TaskRequest request = new TaskRequest();
        request.setTitle("Hijacked");
        request.setDueDate(LocalDate.now().plusDays(1));

        assertThatThrownBy(() -> taskService.updateTask(10L, request, "other@example.com"))
                .isInstanceOf(AccessDeniedException.class);

        verify(taskRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/tasks"), any(Object.class));
    }

    @Test
    void updateTask_asOwner_savesAndBroadcasts() {
        Task task = existingTask(owner);
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskRequest request = new TaskRequest();
        request.setTitle("Updated title");
        request.setStatus(TaskStatus.IN_PROGRESS);
        request.setDueDate(LocalDate.now().plusDays(2));

        TaskResponse response = taskService.updateTask(10L, request, "owner@example.com");

        assertThat(response.getTitle()).isEqualTo("Updated title");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/tasks"), any(Object.class));
    }

    @Test
    void deleteTask_asNonOwnerNonAdmin_throwsAccessDenied_andDoesNotDelete() {
        Task task = existingTask(owner);
        when(userRepository.findByEmail("other@example.com")).thenReturn(Optional.of(otherUser));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> taskService.deleteTask(10L, "other@example.com"))
                .isInstanceOf(AccessDeniedException.class);

        verify(taskRepository, never()).delete(any());
    }

    @Test
    void deleteTask_asAdmin_deletesAnyUsersTask_andBroadcastsDeletion() {
        Task task = existingTask(owner);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        taskService.deleteTask(10L, "admin@example.com");

        verify(taskRepository).delete(task);
        verify(messagingTemplate).convertAndSend("/topic/tasks/deleted", 10L);
    }

    @Test
    void createTask_whenUserNotFound_throwsRuntimeException() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());
        TaskRequest request = new TaskRequest();
        request.setTitle("x");
        request.setDueDate(LocalDate.now());

        assertThatThrownBy(() -> taskService.createTask(request, "ghost@example.com"))
                .isInstanceOf(RuntimeException.class);
    }
}
