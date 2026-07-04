package com.newnop.backend.repository;

import com.newnop.backend.entity.Task;
import com.newnop.backend.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    Page<Task> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Task> findByStatus(TaskStatus status, Pageable pageable);

    Page<Task> findByOwnerIdAndStatus(Long ownerId, TaskStatus status, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE " +
            "(:status IS NULL OR t.status = :status) AND " +
            "(:ownerId IS NULL OR t.owner.id = :ownerId)")
    Page<Task> findWithFilters(
            @Param("status") TaskStatus status,
            @Param("ownerId") Long ownerId,
            Pageable pageable
    );
}
