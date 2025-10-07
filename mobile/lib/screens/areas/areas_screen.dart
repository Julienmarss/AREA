import 'package:flutter/material.dart';

class AreasScreen extends StatelessWidget {
  const AreasScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AREAs'),
        centerTitle: true,
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              _showCreateAreaDialog(context);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              'Your AREAs',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Automation workflows that connect your services',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // AREA Cards
            _buildAreaCard(
              context,
              'Email to Drive',
              'Gmail → Google Drive',
              'When I receive an email with attachment, save it to Drive',
              true,
              Icons.mail,
              Icons.cloud,
            ),
            _buildAreaCard(
              context,
              'GitHub to Discord',
              'GitHub → Discord',
              'When an issue is created, notify the team on Discord',
              true,
              Icons.code,
              Icons.chat,
            ),
            _buildAreaCard(
              context,
              'Twitter to Slack',
              'Twitter → Slack',
              'When I tweet, post a summary to Slack',
              false,
              Icons.alternate_email,
              Icons.work,
            ),
            _buildAreaCard(
              context,
              'Weather Alert',
              'Weather API → Email',
              'When it will rain tomorrow, send me an email',
              true,
              Icons.cloud_queue,
              Icons.mail,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAreaCard(
    BuildContext context,
    String title,
    String services,
    String description,
    bool isActive,
    IconData actionIcon,
    IconData reactionIcon,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Switch(
                  value: isActive,
                  onChanged: (value) {
                    // TODO: Implement toggle functionality
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              services,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(actionIcon, size: 20, color: Colors.green),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Action: $description',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(reactionIcon, size: 20, color: Colors.blue),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Reaction: $description',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _showEditAreaDialog(context, title);
                    },
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _showTestAreaDialog(context, title);
                    },
                    icon: const Icon(Icons.play_arrow, size: 16),
                    label: const Text('Test'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _showDeleteAreaDialog(context, title);
                    },
                    icon: const Icon(Icons.delete, size: 16),
                    label: const Text('Delete'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateAreaDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create New AREA'),
        content: const Text('This will open the AREA builder to create a new automation workflow.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Navigate to AREA builder
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Opening AREA builder...'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  void _showEditAreaDialog(BuildContext context, String areaName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit $areaName'),
        content: const Text('This will open the AREA builder to modify this automation workflow.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Navigate to AREA builder with existing AREA
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Editing $areaName...'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            child: const Text('Edit'),
          ),
        ],
      ),
    );
  }

  void _showTestAreaDialog(BuildContext context, String areaName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Test $areaName'),
        content: const Text('This will trigger the AREA once to test if it works correctly.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement test functionality
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Testing $areaName...'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Test'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAreaDialog(BuildContext context, String areaName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete $areaName'),
        content: Text('Are you sure you want to delete "$areaName"? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement delete functionality
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$areaName deleted'),
                  backgroundColor: Colors.red,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
