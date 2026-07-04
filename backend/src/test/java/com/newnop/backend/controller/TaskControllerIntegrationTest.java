package com.newnop.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TaskControllerIntegrationTest {

  @Autowired private MockMvc mockMvc;

  private final ObjectMapper objectMapper = new ObjectMapper();

  private String registerAndLogin(String username, String email) throws Exception {
    mockMvc.perform(
        post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(
                objectMapper.writeValueAsString(
                    Map.of(
                        "username", username,
                        "email", email,
                        "password", "password123"))));

    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            Map.of("email", email, "password", "password123"))))
            .andReturn();

    Map<?, ?> body = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
    Map<?, ?> data = (Map<?, ?>) body.get("data");
    return "Bearer " + data.get("token");
  }

  private String adminToken() throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            Map.of(
                                "email", "admin@tasktracker.local",
                                "password", "admin123"))))
            .andReturn();
    Map<?, ?> body = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
    Map<?, ?> data = (Map<?, ?>) body.get("data");
    return "Bearer " + data.get("token");
  }

  private String taskPayload(String title, String status, LocalDate dueDate) throws Exception {
    return objectMapper.writeValueAsString(
        Map.of(
            "title",
            title,
            "description",
            "some description",
            "status",
            status,
            "dueDate",
            dueDate.toString()));
  }

  private Long createTask(String token, String title) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/tasks")
                    .header("Authorization", token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(taskPayload(title, "TODO", LocalDate.now().plusDays(3))))
            .andExpect(status().isOk())
            .andReturn();
    Map<?, ?> body = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
    Map<?, ?> data = (Map<?, ?>) body.get("data");
    return ((Number) data.get("id")).longValue();
  }

  @Test
  void createTask_withoutAuth_isUnauthorized() throws Exception {
    mockMvc
        .perform(
            post("/api/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskPayload("No auth task", "TODO", LocalDate.now().plusDays(1))))
        .andExpect(status().isForbidden());
  }

  @Test
  void createTask_thenGetById_asOwner_succeeds() throws Exception {
    String token = registerAndLogin("owner1", "owner1@example.com");
    Long id = createTask(token, "Write tests");

    mockMvc
        .perform(get("/api/tasks/" + id).header("Authorization", token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.title").value("Write tests"))
        .andExpect(jsonPath("$.data.ownerUsername").value("owner1"));
  }

  @Test
  void getTaskById_asDifferentNonAdminUser_isForbidden() throws Exception {
    String ownerToken = registerAndLogin("owner2", "owner2@example.com");
    Long id = createTask(ownerToken, "Private task");

    String otherToken = registerAndLogin("intruder", "intruder@example.com");

    mockMvc
        .perform(get("/api/tasks/" + id).header("Authorization", otherToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void getTaskById_asAdmin_canViewAnyUsersTask() throws Exception {
    String ownerToken = registerAndLogin("owner3", "owner3@example.com");
    Long id = createTask(ownerToken, "Admin-visible task");

    mockMvc
        .perform(get("/api/tasks/" + id).header("Authorization", adminToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.ownerUsername").value("owner3"));
  }

  @Test
  void createTask_missingTitle_returnsValidationError() throws Exception {
    String token = registerAndLogin("owner4", "owner4@example.com");

    mockMvc
        .perform(
            post("/api/tasks")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of(
                            "description",
                            "no title here",
                            "dueDate",
                            LocalDate.now().plusDays(1).toString()))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.data.title").exists());
  }

  @Test
  void createTask_pastDueDate_returnsValidationError() throws Exception {
    String token = registerAndLogin("owner5", "owner5@example.com");

    mockMvc
        .perform(
            post("/api/tasks")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskPayload("Time travel task", "TODO", LocalDate.now().minusDays(1))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.data.dueDate").exists());
  }

  @Test
  void listTasks_asRegularUser_onlySeesOwnTasks() throws Exception {
    String user1Token = registerAndLogin("lister1", "lister1@example.com");
    String user2Token = registerAndLogin("lister2", "lister2@example.com");
    createTask(user1Token, "User1 task A");
    createTask(user1Token, "User1 task B");
    createTask(user2Token, "User2 task A");

    mockMvc
        .perform(get("/api/tasks").header("Authorization", user1Token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content.length()").value(2))
        .andExpect(
            jsonPath(
                "$.data.content[*].ownerUsername",
                org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("lister1"))));
  }

  @Test
  void listTasks_asAdmin_seesTasksFromAllUsers() throws Exception {
    String user1Token = registerAndLogin("all1", "all1@example.com");
    String user2Token = registerAndLogin("all2", "all2@example.com");
    createTask(user1Token, "All1 task");
    createTask(user2Token, "All2 task");

    MvcResult result =
        mockMvc
            .perform(get("/api/tasks").header("Authorization", adminToken()).param("size", "100"))
            .andExpect(status().isOk())
            .andReturn();

    Map<?, ?> body = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
    Map<?, ?> data = (Map<?, ?>) body.get("data");
    java.util.List<?> content = (java.util.List<?>) data.get("content");
    assertThat(content.size()).isGreaterThanOrEqualTo(2);
  }

  @Test
  void listTasks_filteredByStatus_onlyReturnsMatchingTasks() throws Exception {
    String token = registerAndLogin("filterer", "filterer@example.com");
    Long doneId = createTask(token, "Filter status task");

    mockMvc.perform(
        put("/api/tasks/" + doneId)
            .header("Authorization", token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(taskPayload("Filter status task", "DONE", LocalDate.now().plusDays(3))));

    mockMvc
        .perform(get("/api/tasks").header("Authorization", token).param("status", "DONE"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content[0].status").value("DONE"));

    mockMvc
        .perform(get("/api/tasks").header("Authorization", token).param("status", "TODO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content.length()").value(0));
  }

  @Test
  void updateTask_asNonOwnerNonAdmin_isForbidden() throws Exception {
    String ownerToken = registerAndLogin("upowner", "upowner@example.com");
    Long id = createTask(ownerToken, "Original title");

    String otherToken = registerAndLogin("upintruder", "upintruder@example.com");

    mockMvc
        .perform(
            put("/api/tasks/" + id)
                .header("Authorization", otherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(taskPayload("Hijacked title", "TODO", LocalDate.now().plusDays(1))))
        .andExpect(status().isForbidden());
  }

  @Test
  void updateTask_asAdmin_canUpdateAnyUsersTask() throws Exception {
    String ownerToken = registerAndLogin("upowner2", "upowner2@example.com");
    Long id = createTask(ownerToken, "Before admin edit");

    mockMvc
        .perform(
            put("/api/tasks/" + id)
                .header("Authorization", adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    taskPayload("Edited by admin", "IN_PROGRESS", LocalDate.now().plusDays(5))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.title").value("Edited by admin"))
        .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
  }

  @Test
  void deleteTask_asNonOwnerNonAdmin_isForbidden() throws Exception {
    String ownerToken = registerAndLogin("delowner", "delowner@example.com");
    Long id = createTask(ownerToken, "Do not delete me");

    String otherToken = registerAndLogin("delintruder", "delintruder@example.com");

    mockMvc
        .perform(delete("/api/tasks/" + id).header("Authorization", otherToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void deleteTask_asOwner_removesTask() throws Exception {
    String token = registerAndLogin("delowner2", "delowner2@example.com");
    Long id = createTask(token, "Delete me");

    mockMvc
        .perform(delete("/api/tasks/" + id).header("Authorization", token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true));

    mockMvc
        .perform(get("/api/tasks/" + id).header("Authorization", token))
        .andExpect(status().isBadRequest());
  }
}
